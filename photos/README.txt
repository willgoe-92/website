================================================================================
PHOTOS FOLDER - Dog Walks Map
================================================================================

This folder contains geotagged photos that are automatically displayed on the
"Dog Walks" map on the website.

================================================================================
HOW IT WORKS
================================================================================

1. AUTOMATIC DISCOVERY
   - The website uses the GitHub API to automatically fetch all image files
     from this folder
   - No code changes needed when adding new photos!

2. EXIF GPS EXTRACTION
   - Each photo's GPS coordinates are read from EXIF metadata
   - EXIF data is embedded in photos by cameras/smartphones
   - The EXIF.js library extracts: latitude, longitude, and date/time

3. MAP PLOTTING
   - Photos with valid GPS data are plotted on the Leaflet map
   - Markers show thumbnail images
   - Clicking a marker displays the full photo in a popup

================================================================================
ADDING NEW PHOTOS
================================================================================

To add photos to the map:

1. Make sure your photos have GPS data (geotagged)
   - Most smartphones automatically add GPS to photos
   - Check: Right-click photo → Properties → Details → GPS section

2. Upload photos to this /photos folder on GitHub
   - Supported formats: .jpg, .jpeg, .png, .gif
   - File names don't matter (can be anything)

3. That's it!
   - The map will automatically find and display them
   - Photos without GPS data will be skipped (won't cause errors)

================================================================================
TECHNICAL DETAILS
================================================================================

File Type Filtering:
- Only image files are processed: .jpg, .jpeg, .png, .gif
- Filter is case-insensitive (JPG and jpg both work)
- Other file types (like this README.txt) are ignored

API Endpoint:
- https://api.github.com/repos/willgoe-92/website/contents/photos
- GitHub API returns list of all files in this directory
- Public repository = no authentication needed

JavaScript File:
- See: /assets/js/dog-walks.js
- Function: getPhotoFilesFromGitHub() (line ~62)
- Regex pattern: /\.(jpg|jpeg|png|gif)$/i

GPS Coordinate Format:
- EXIF stores GPS as DMS (Degrees, Minutes, Seconds)
- Example: 38° 54' 26" N, 77° 0' 8" W
- Code converts to Decimal Degrees for Leaflet
- Example: 38.9072, -77.0022

Fallback Behavior:
- If GitHub API fails, uses hardcoded photo list
- See dog-walks.js lines ~80-83

================================================================================
TROUBLESHOOTING
================================================================================

Photo not showing on map?

1. Check if photo has GPS data
   - Windows: Right-click → Properties → Details → GPS
   - Mac: Open in Preview → Tools → Show Inspector → GPS tab
   - Online: Use an EXIF viewer website

2. Check browser console for errors
   - Press F12 to open developer tools
   - Look for errors mentioning your photo filename

3. Verify file format
   - Must be .jpg, .jpeg, .png, or .gif
   - Check file extension is correct

4. GitHub Pages cache
   - Changes may take a few minutes to appear
   - Try hard refresh: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)

================================================================================
PRIVACY NOTE
================================================================================

⚠️ IMPORTANT: GPS data reveals exact locations where photos were taken!

- Only upload photos you're comfortable sharing publicly
- GPS data shows your home, routes, favorite places, etc.
- Consider removing GPS data from sensitive photos

To remove GPS data:
- Windows: Right-click → Properties → Details → Remove Properties
- Mac: Use apps like ImageOptim or Preview
- Online: Use EXIF removal tools

================================================================================

For more information, see the comments in /assets/js/dog-walks.js

Last updated: 2025-09-30
