// Simple EXIF GPS reader
// Adapted from exif-js for reading GPS data from images
(function() {
  window.getPhotoGPS = function(imageUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';

      img.onload = function() {
        const exifData = getEXIFData(img);
        if (exifData && exifData.GPSLatitude && exifData.GPSLongitude) {
          const lat = convertDMSToDD(
            exifData.GPSLatitude[0],
            exifData.GPSLatitude[1],
            exifData.GPSLatitude[2],
            exifData.GPSLatitudeRef
          );
          const lng = convertDMSToDD(
            exifData.GPSLongitude[0],
            exifData.GPSLongitude[1],
            exifData.GPSLongitude[2],
            exifData.GPSLongitudeRef
          );
          resolve({ lat, lng });
        } else {
          reject('No GPS data found');
        }
      };

      img.onerror = () => reject('Failed to load image');
      img.src = imageUrl;
    });
  };

  function convertDMSToDD(degrees, minutes, seconds, direction) {
    let dd = degrees + (minutes / 60) + (seconds / 3600);
    if (direction === 'S' || direction === 'W') {
      dd = dd * -1;
    }
    return dd;
  }

  function getEXIFData(img) {
    // This is a simplified version - you'd need full exif-js library
    // For now, return null and we'll use a different approach
    return null;
  }
})();
