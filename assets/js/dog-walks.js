/**
 * DOG WALKS MAP - Displays geotagged photos from dog walks
 *
 * This script automatically:
 * 1. Fetches all image files from the GitHub photos folder
 * 2. Reads GPS coordinates from each photo's EXIF data
 * 3. Plots photos on an interactive Leaflet map
 * 4. Clusters nearby photos for better visualization
 *
 * Dependencies:
 * - Leaflet.js (mapping library)
 * - Leaflet.Photo (photo marker plugin)
 * - Leaflet.markercluster (clustering plugin)
 * - EXIF.js (reads EXIF data from images)
 *
 * How to add more photos:
 * - Simply upload geotagged photos to the /photos folder on GitHub
 * - They will automatically appear on the map (no code changes needed!)
 * - Only .jpg, .jpeg, .png, and .gif files are processed
 */

// Wait for page to fully load before initializing map
document.addEventListener("DOMContentLoaded", function () {
  console.log("Initializing Dog Walks map...");

  // Check if the map container exists in the HTML
  const mapDiv = document.getElementById("dog-walks-map");
  if (!mapDiv) {
    console.error("Dog Walks map container not found!");
    return;
  }

  try {
    // ============================================================================
    // 1. CREATE THE BASE MAP
    // ============================================================================

    // Initialize Leaflet map centered on DMV area (Washington DC region)
    const dogWalksMap = L.map("dog-walks-map", {
      renderer: L.canvas({ tolerance: 10 }), // Use canvas for better performance
    }).setView([38.9072, -77.0369], 12); // Default center: DMV, zoom level 12

    // Add MapTiler streets basemap (matches styling of other maps on the site)
    L.tileLayer(
      "https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=WcjuUvQEzg8QoDzAiDZB",
      {
        attribution: "© MapTiler © OpenStreetMap contributors",
        maxZoom: 18,
      }
    ).addTo(dogWalksMap);

    // ============================================================================
    // 2. AUTO-FETCH PHOTOS FROM GITHUB
    // ============================================================================

    /**
     * Fetches list of all image files from the GitHub photos folder
     * Uses GitHub API to get directory contents
     *
     * @returns {Promise<Array<string>>} Array of photo URLs (e.g., ['photos/image1.jpg', 'photos/image2.jpg'])
     */
    async function getPhotoFilesFromGitHub() {
      try {
        // Call GitHub API to get contents of /photos folder
        const response = await fetch('https://api.github.com/repos/willgoe-92/website/contents/photos');
        const files = await response.json();

        // Filter for image files only (.jpg, .jpeg, .png, .gif)
        // This regex pattern checks file extension (case-insensitive)
        const imageFiles = files
          .filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file.name))
          .map(file => `photos/${file.name}`);

        console.log('Found photos on GitHub:', imageFiles);
        return imageFiles;
      } catch (error) {
        console.error('Error fetching photo list from GitHub:', error);

        // Fallback: If GitHub API fails, use hardcoded list of photos
        return [
          'photos/PXL_20250731_193633228.jpg',
          'photos/PXL_20250807_162648686.jpg'
        ];
      }
    }

    // ============================================================================
    // 3. GPS COORDINATE CONVERSION
    // ============================================================================

    /**
     * Converts GPS coordinates from DMS (Degrees, Minutes, Seconds) to Decimal Degrees
     *
     * EXIF GPS data is stored as DMS, but Leaflet needs Decimal Degrees
     * Example: 38° 54' 26" N = 38.9072°
     *
     * @param {number} degrees - Degrees value
     * @param {number} minutes - Minutes value (0-59)
     * @param {number} seconds - Seconds value (0-59)
     * @param {string} direction - N/S for latitude, E/W for longitude
     * @returns {number} Decimal degree value
     */
    function convertDMSToDD(degrees, minutes, seconds, direction) {
      // Formula: DD = degrees + (minutes/60) + (seconds/3600)
      let dd = degrees + (minutes / 60) + (seconds / 3600);

      // South and West are negative values
      if (direction === 'S' || direction === 'W') {
        dd = dd * -1;
      }
      return dd;
    }

    // ============================================================================
    // 4. EXTRACT GPS DATA FROM PHOTO EXIF
    // ============================================================================

    /**
     * Reads EXIF metadata from an image and extracts GPS coordinates
     *
     * EXIF data is metadata embedded in photos by cameras/phones
     * Includes: GPS location, date/time, camera settings, etc.
     *
     * @param {string} imageUrl - URL to the image file
     * @returns {Promise<Object>} Object with lat, lng, and dateTime
     */
    function getPhotoGPS(imageUrl) {
      return new Promise((resolve, reject) => {
        console.log('Attempting to load image:', imageUrl);

        // Create new image element to load the photo
        const img = new Image();
        img.crossOrigin = 'anonymous'; // Allow loading from GitHub (CORS)

        // When image loads successfully
        img.onload = function() {
          console.log('Image loaded successfully:', imageUrl);

          // Use EXIF.js library to extract metadata
          EXIF.getData(img, function() {
            console.log('EXIF data retrieved for:', imageUrl);

            // Extract GPS tags from EXIF data
            const lat = EXIF.getTag(this, "GPSLatitude");       // [degrees, minutes, seconds]
            const latRef = EXIF.getTag(this, "GPSLatitudeRef"); // "N" or "S"
            const lng = EXIF.getTag(this, "GPSLongitude");      // [degrees, minutes, seconds]
            const lngRef = EXIF.getTag(this, "GPSLongitudeRef");// "E" or "W"
            const dateTime = EXIF.getTag(this, "DateTime");     // "2025:07:31 19:36:33"

            console.log('GPS Data:', {
              lat: lat,
              latRef: latRef,
              lng: lng,
              lngRef: lngRef,
              dateTime: dateTime
            });

            // Check if GPS data exists
            if (lat && lng) {
              // Convert from DMS to Decimal Degrees
              const latitude = convertDMSToDD(lat[0], lat[1], lat[2], latRef);
              const longitude = convertDMSToDD(lng[0], lng[1], lng[2], lngRef);

              console.log('Converted coordinates:', { latitude, longitude });

              // Return the GPS data
              resolve({
                lat: latitude,
                lng: longitude,
                dateTime: dateTime
              });
            } else {
              // Photo doesn't have GPS data - reject
              console.warn('No GPS coordinates found in EXIF for:', imageUrl);
              reject('No GPS data found in image');
            }
          });
        };

        // If image fails to load
        img.onerror = (e) => {
          console.error('Failed to load image:', imageUrl, e);
          reject('Failed to load image');
        };

        // Start loading the image
        img.src = imageUrl;
      });
    }

    // ============================================================================
    // 5. CREATE PHOTO LAYER WITH CLUSTERING
    // ============================================================================

    // Create a clustered photo layer using Leaflet.Photo
    // Clustering groups nearby photos together to avoid clutter
    const photoLayer = L.photo.cluster().on('click', function (evt) {
      // When user clicks a photo marker
      const photo = evt.layer.photo;

      // Create popup template with full-size image and caption
      const template = '<img src="{url}" style="max-width: 100%; max-height: 400px;"/><p>{caption}</p>';

      // Bind and open popup
      evt.layer.bindPopup(L.Util.template(template, photo), {
        className: 'leaflet-popup-photo', // Custom CSS class for styling
        minWidth: 400
      }).openPopup();
    });

    // Add photo layer to map
    photoLayer.addTo(dogWalksMap);

    // ============================================================================
    // 6. LOAD AND PROCESS ALL PHOTOS
    // ============================================================================

    // Get photo files from GitHub, then process each one
    getPhotoFilesFromGitHub().then(photoFiles => {

      // Process each photo asynchronously (all at once)
      return Promise.all(photoFiles.map(photoUrl => {
        // For each photo URL, extract GPS data
        return getPhotoGPS(photoUrl)
          .then(gps => {
            // Successfully read GPS - create photo object
            const filename = photoUrl.split('/').pop();
            const date = gps.dateTime ? gps.dateTime.split(' ')[0] : 'Unknown date';

            // Return photo object in format Leaflet.Photo expects
            return {
              lat: gps.lat,           // Latitude
              lng: gps.lng,           // Longitude
              url: photoUrl,          // Full-size image URL
              iconUrl: photoUrl,      // Thumbnail URL (same as full-size)
              caption: `Dog Walk - ${date}` // Caption shown in popup
            };
          })
          .catch(err => {
            // Failed to read GPS from this photo
            console.error(`Failed to load GPS from ${photoUrl}:`, err);
            return null; // Return null so we can filter it out
          });
      }))
      .then(photoData => {
        // Filter out any photos that failed to load (null values)
        const validPhotos = photoData.filter(p => p !== null);

        if (validPhotos.length > 0) {
          // Successfully loaded at least one photo
          console.log('Photo data being added to map:', validPhotos);

          // Add all photos to the map layer
          photoLayer.add(validPhotos);

          console.log(`Loaded ${validPhotos.length} photos with GPS data`);
          console.log('PhotoLayer object:', photoLayer);
          console.log('Number of layers in photoLayer:', photoLayer.getLayers().length);

          // Automatically zoom map to fit all photos
          const bounds = L.latLngBounds(validPhotos.map(p => [p.lat, p.lng]));
          dogWalksMap.fitBounds(bounds, { padding: [50, 50] });

          console.log('Map bounds set to:', bounds);
        } else {
          // No photos with GPS data found
          console.warn('No photos with GPS data could be loaded');
        }
      });
    });

    console.log("Dog Walks map initialized successfully");

  } catch (e) {
    console.error("Error creating Dog Walks map:", e);
  }
});
