// Dog Walks Map with Leaflet.Photo - Auto-read GPS from photos
document.addEventListener("DOMContentLoaded", function () {
  console.log("Initializing Dog Walks map...");

  const mapDiv = document.getElementById("dog-walks-map");
  if (!mapDiv) {
    console.error("Dog Walks map container not found!");
    return;
  }

  try {
    // Create map centered on DMV area
    const dogWalksMap = L.map("dog-walks-map", {
      renderer: L.canvas({ tolerance: 10 }),
    }).setView([38.9072, -77.0369], 12);

    // Add MapTiler streets basemap (same style as other maps)
    L.tileLayer(
      "https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=WcjuUvQEzg8QoDzAiDZB",
      {
        attribution: "© MapTiler © OpenStreetMap contributors",
        maxZoom: 18,
      }
    ).addTo(dogWalksMap);

    // Automatically fetch all photos from the photos folder on GitHub
    async function getPhotoFilesFromGitHub() {
      try {
        const response = await fetch('https://api.github.com/repos/willgoe-92/website/contents/photos');
        const files = await response.json();

        // Filter for image files only
        const imageFiles = files
          .filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file.name))
          .map(file => `photos/${file.name}`);

        console.log('Found photos on GitHub:', imageFiles);
        return imageFiles;
      } catch (error) {
        console.error('Error fetching photo list from GitHub:', error);
        // Fallback to manual list if API fails
        return [
          'photos/PXL_20250731_193633228.jpg',
          'photos/PXL_20250807_162648686.jpg'
        ];
      }
    }

    // Function to convert DMS to Decimal Degrees
    function convertDMSToDD(degrees, minutes, seconds, direction) {
      let dd = degrees + (minutes / 60) + (seconds / 3600);
      if (direction === 'S' || direction === 'W') {
        dd = dd * -1;
      }
      return dd;
    }

    // Function to extract GPS from photo
    function getPhotoGPS(imageUrl) {
      return new Promise((resolve, reject) => {
        console.log('Attempting to load image:', imageUrl);
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = function() {
          console.log('Image loaded successfully:', imageUrl);
          EXIF.getData(img, function() {
            console.log('EXIF data retrieved for:', imageUrl);
            const lat = EXIF.getTag(this, "GPSLatitude");
            const latRef = EXIF.getTag(this, "GPSLatitudeRef");
            const lng = EXIF.getTag(this, "GPSLongitude");
            const lngRef = EXIF.getTag(this, "GPSLongitudeRef");
            const dateTime = EXIF.getTag(this, "DateTime");

            console.log('GPS Data:', {
              lat: lat,
              latRef: latRef,
              lng: lng,
              lngRef: lngRef,
              dateTime: dateTime
            });

            if (lat && lng) {
              const latitude = convertDMSToDD(lat[0], lat[1], lat[2], latRef);
              const longitude = convertDMSToDD(lng[0], lng[1], lng[2], lngRef);

              console.log('Converted coordinates:', { latitude, longitude });

              resolve({
                lat: latitude,
                lng: longitude,
                dateTime: dateTime
              });
            } else {
              console.warn('No GPS coordinates found in EXIF for:', imageUrl);
              reject('No GPS data found in image');
            }
          });
        };

        img.onerror = (e) => {
          console.error('Failed to load image:', imageUrl, e);
          reject('Failed to load image');
        };
        img.src = imageUrl;
      });
    }

    // Load all photos and extract GPS
    const photoLayer = L.photo.cluster().on('click', function (evt) {
      const photo = evt.layer.photo;
      const template = '<img src="{url}" style="max-width: 100%; max-height: 400px;"/><p>{caption}</p>';

      evt.layer.bindPopup(L.Util.template(template, photo), {
        className: 'leaflet-popup-photo',
        minWidth: 400
      }).openPopup();
    });

    photoLayer.addTo(dogWalksMap);

    // Get photo files from GitHub and process them
    getPhotoFilesFromGitHub().then(photoFiles => {
      // Process each photo
      return Promise.all(photoFiles.map(photoUrl => {
      return getPhotoGPS(photoUrl)
        .then(gps => {
          const filename = photoUrl.split('/').pop();
          const date = gps.dateTime ? gps.dateTime.split(' ')[0] : 'Unknown date';

          return {
            lat: gps.lat,
            lng: gps.lng,
            url: photoUrl,
            iconUrl: photoUrl,
            caption: `Dog Walk - ${date}`
          };
        })
        .catch(err => {
          console.error(`Failed to load GPS from ${photoUrl}:`, err);
          return null;
        });
      }))
      .then(photoData => {
      // Filter out failed photos
      const validPhotos = photoData.filter(p => p !== null);

      if (validPhotos.length > 0) {
        console.log('Photo data being added to map:', validPhotos);
        photoLayer.add(validPhotos);
        console.log(`Loaded ${validPhotos.length} photos with GPS data`);
        console.log('PhotoLayer object:', photoLayer);
        console.log('Number of layers in photoLayer:', photoLayer.getLayers().length);

        // Fit map to show all photos
        const bounds = L.latLngBounds(validPhotos.map(p => [p.lat, p.lng]));
        dogWalksMap.fitBounds(bounds, { padding: [50, 50] });

        console.log('Map bounds set to:', bounds);
      } else {
        console.warn('No photos with GPS data could be loaded');
      }
      });
    });

    console.log("Dog Walks map initialized successfully");

  } catch (e) {
    console.error("Error creating Dog Walks map:", e);
  }
});
