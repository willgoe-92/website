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

    // List of photos to load
    const photoFiles = [
      'photos/PXL_20250731_193633228.jpg',
      'photos/PXL_20250807_162648686.jpg'
    ];

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
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = function() {
          EXIF.getData(img, function() {
            const lat = EXIF.getTag(this, "GPSLatitude");
            const latRef = EXIF.getTag(this, "GPSLatitudeRef");
            const lng = EXIF.getTag(this, "GPSLongitude");
            const lngRef = EXIF.getTag(this, "GPSLongitudeRef");
            const dateTime = EXIF.getTag(this, "DateTime");

            if (lat && lng) {
              const latitude = convertDMSToDD(lat[0], lat[1], lat[2], latRef);
              const longitude = convertDMSToDD(lng[0], lng[1], lng[2], lngRef);

              resolve({
                lat: latitude,
                lng: longitude,
                dateTime: dateTime
              });
            } else {
              reject('No GPS data found in image');
            }
          });
        };

        img.onerror = () => reject('Failed to load image');
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

    // Process each photo
    Promise.all(photoFiles.map(photoUrl => {
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
        photoLayer.add(validPhotos);
        console.log(`Loaded ${validPhotos.length} photos with GPS data`);

        // Fit map to show all photos
        const bounds = L.latLngBounds(validPhotos.map(p => [p.lat, p.lng]));
        dogWalksMap.fitBounds(bounds, { padding: [50, 50] });
      } else {
        console.warn('No photos with GPS data could be loaded');
      }
    });

    console.log("Dog Walks map initialized successfully");

  } catch (e) {
    console.error("Error creating Dog Walks map:", e);
  }
});
