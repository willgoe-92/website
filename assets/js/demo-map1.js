// assets/js/demo-map1.js
document.addEventListener("DOMContentLoaded", function () {
  console.log("Initializing map...");
  var mapDiv = document.getElementById("demo-map");
  if (!mapDiv) {
    console.error("Map container not found!");
    return;
  }
  try {
    // Create map centered on Manhattan, Kansas (K-State area)
    var map = L.map("demo-map", {
      renderer: L.canvas({ tolerance: 10 }),
    }).setView([39.19, -96.59], 13);

    // Add MapTiler streets basemap
    var streetsLayer = L.tileLayer(
      "https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=WcjuUvQEzg8QoDzAiDZB",
      {
        attribution: "© MapTiler © OpenStreetMap contributors",
        maxZoom: 18,
      }
    );
    streetsLayer.addTo(map);


    // GeoJSON data is loaded from displaypoints-data.js file

    // Function to calculate centroid of a polygon
    function calculateCentroid(coordinates) {
      let x = 0, y = 0, area = 0;
      const ring = coordinates[0]; // Use outer ring for polygons
      
      for (let i = 0; i < ring.length - 1; i++) {
        const x0 = ring[i][0];
        const y0 = ring[i][1];
        const x1 = ring[i + 1][0];
        const y1 = ring[i + 1][1];
        
        const a = x0 * y1 - x1 * y0;
        x += (x0 + x1) * a;
        y += (y0 + y1) * a;
        area += a;
      }
      
      area *= 0.5;
      x /= (6 * area);
      y /= (6 * area);
      
      return [x, y];
    }

    // Function to convert all features to points
    function convertToPoints(data) {
      const convertedData = JSON.parse(JSON.stringify(data)); // Deep copy
      
      convertedData.features.forEach(feature => {
        if (feature.geometry.type === 'Polygon') {
          const centroid = calculateCentroid(feature.geometry.coordinates);
          feature.geometry = {
            type: 'Point',
            coordinates: centroid
          };
        }
        // Points remain unchanged
      });
      
      return convertedData;
    }

    // Convert polygon features to points
    const convertedDisplayPointsData = convertToPoints(displayPointsData);

    // Function to get cuisine type and color
    function getCuisineStyle(feature) {
      const cuisine = feature.properties.cuisine || 'cafe';
      
      const cuisineColors = {
        'mexican': '#E74C3C',        // Red
        'american': '#3498DB',       // Blue  
        'italian': '#27AE60',        // Green
        'chinese': '#F39C12',        // Orange
        'japanese': '#9B59B6',       // Purple
        'indian': '#E67E22',         // Dark Orange
        'thai': '#1ABC9C',           // Teal
        'pizza': '#E74C3C',          // Red (similar to italian)
        'burger': '#3498DB',         // Blue (similar to american)
        'sandwich': '#F1C40F',       // Yellow
        'coffee': '#8B4513',         // Brown
        'ice_cream': '#FFB6C1',      // Light Pink
        'bakery': '#DEB887',         // Tan
        'seafood': '#20B2AA',        // Light Sea Green
        'steak_house': '#8B0000',    // Dark Red
        'barbecue': '#CD853F',       // Peru
        'fast_food': '#FF4500',      // Orange Red
        'cafe': '#6F4E37'            // Coffee Brown (default)
      };

      return {
        color: cuisineColors[cuisine] || cuisineColors['cafe'],
        cuisine: cuisine
      };
    }

    // Create Display Points layer using converted data (all as points)
    var displayPointsLayer = L.geoJSON(convertedDisplayPointsData, {
      pointToLayer: function (feature, latlng) {
        // All features are now points
        const style = getCuisineStyle(feature);
        return L.circleMarker(latlng, {
          radius: 8,
          fillColor: style.color,
          color: "#fff",
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8,
        });
      },
      onEachFeature: function (feature, layer) {
        if (feature.properties) {
          const props = feature.properties;
          const name = props.name || props.alt_name || 'Restaurant';
          const cuisine = props.cuisine || 'cafe';
          const amenity = props.amenity || '';
          const cuisineStyle = getCuisineStyle(feature);
          
          // Build address from components
          let address = '';
          if (props['addr:housenumber'] && props['addr:street']) {
            address = `${props['addr:housenumber']} ${props['addr:street']}`;
            if (props['addr:city']) address += `, ${props['addr:city']}`;
            if (props['addr:postcode']) address += ` ${props['addr:postcode']}`;
          }
          
          let popupContent = `
            <div class="restaurant-popup">
              <div class="popup-header">
                <h3 class="restaurant-name" style="color: ${cuisineStyle.color};">${name}</h3>
                <span class="cuisine-badge" style="background-color: ${cuisineStyle.color};">${cuisine.replace('_', ' ')}</span>
              </div>
              <div class="popup-body">
          `;
          
          // Add amenity info if available
          if (amenity && amenity !== 'restaurant' && amenity !== 'fast_food') {
            popupContent += `
              <div class="popup-info">
                <span class="popup-icon">🏪</span>
                <span class="popup-label">Type:</span>
                <span class="popup-value">${amenity.replace('_', ' ')}</span>
              </div>
            `;
          }
          
          // Add opening hours
          if (props.opening_hours) {
            popupContent += `
              <div class="popup-info">
                <span class="popup-icon">🕒</span>
                <span class="popup-label">Hours:</span>
                <span class="popup-value">${props.opening_hours}</span>
              </div>
            `;
          }
          
          // Add phone number
          if (props.phone) {
            popupContent += `
              <div class="popup-info">
                <span class="popup-icon">📞</span>
                <span class="popup-label">Phone:</span>
                <span class="popup-value">${props.phone}</span>
              </div>
            `;
          }
          
          // Add website
          if (props.website) {
            const displayUrl = props.website.replace(/^https?:\/\//, '').replace(/\/$/, '');
            popupContent += `
              <div class="popup-info">
                <span class="popup-icon">🌐</span>
                <span class="popup-label">Website:</span>
                <span class="popup-value">
                  <a href="${props.website}" target="_blank" class="popup-website">${displayUrl}</a>
                </span>
              </div>
            `;
          }
          
          // Add address at the bottom if available
          if (address) {
            popupContent += `
              <div class="popup-address">
                📍 ${address}
              </div>
            `;
          }
          
          popupContent += `
              </div>
            </div>
          `;
          
          layer.bindPopup(popupContent, {
            maxWidth: 300,
            className: 'custom-popup'
          });
        }
      },
    });

    // Add layers to map first
    displayPointsLayer.addTo(map);

    // Dashboard functionality
    let currentFilter = 'all';

    // Get cuisine colors
    const cuisineColors = {
      'mexican': '#E74C3C',
      'american': '#3498DB',
      'italian': '#27AE60',
      'chinese': '#F39C12',
      'japanese': '#9B59B6',
      'indian': '#E67E22',
      'thai': '#1ABC9C',
      'pizza': '#E74C3C',
      'burger': '#3498DB',
      'sandwich': '#F1C40F',
      'coffee': '#8B4513',
      'ice_cream': '#FFB6C1',
      'bakery': '#DEB887',
      'seafood': '#20B2AA',
      'steak_house': '#8B0000',
      'barbecue': '#CD853F',
      'fast_food': '#FF4500',
      'cafe': '#6F4E37'
    };

    // Function to get features in current map bounds
    function getFeaturesInBounds() {
      const bounds = map.getBounds();
      const featuresInView = [];
      
      convertedDisplayPointsData.features.forEach(feature => {
        // All features are now points after conversion
        const coords = L.latLng(feature.geometry.coordinates[1], feature.geometry.coordinates[0]);
        
        if (bounds.contains(coords)) {
          featuresInView.push(feature);
        }
      });
      
      return featuresInView;
    }

    // Function to update table with restaurants in current view
    function updateTable() {
      const featuresInView = getFeaturesInBounds();
      const tbody = document.getElementById('restaurants-tbody');
      tbody.innerHTML = '';

      // Filter features based on current filter
      let filteredFeatures = featuresInView;
      if (currentFilter !== 'all') {
        filteredFeatures = featuresInView.filter(feature => {
          const cuisine = feature.properties.cuisine || 'cafe';
          return cuisine === currentFilter;
        });
      }

      filteredFeatures.forEach(feature => {
        const props = feature.properties;
        const name = props.name || props.alt_name || 'Unnamed';
        const cuisine = props.cuisine || 'cafe';
        const hours = props.opening_hours || 'Not listed';
        const phone = props.phone || 'Not listed';
        
        const row = document.createElement('tr');
        const cuisineColor = cuisineColors[cuisine] || cuisineColors['cafe'];
        
        row.innerHTML = `
          <td>${name}</td>
          <td><span class="cuisine-cell" style="background-color: ${cuisineColor}">${cuisine.replace('_', ' ')}</span></td>
          <td>${hours}</td>
          <td>${phone}</td>
        `;
        
        tbody.appendChild(row);
      });
    }

    // Function to populate filter dropdown
    function populateFilter() {
      const select = document.getElementById('cuisine-filter');
      const allCuisines = new Set();
      
      convertedDisplayPointsData.features.forEach(feature => {
        const cuisine = feature.properties.cuisine || 'cafe';
        allCuisines.add(cuisine);
      });
      
      // Clear existing options except "All"
      select.innerHTML = '<option value="all">All Cuisines</option>';
      
      // Add cuisine options
      Array.from(allCuisines).sort().forEach(cuisine => {
        const option = document.createElement('option');
        option.value = cuisine;
        option.textContent = cuisine.replace('_', ' ');
        select.appendChild(option);
      });
    }

    // Function to filter features
    function filterFeatures(selectedCuisine) {
      currentFilter = selectedCuisine;
      
      displayPointsLayer.eachLayer(layer => {
        const feature = layer.feature;
        const cuisine = feature.properties.cuisine || 'cafe';
        
        if (selectedCuisine === 'all' || cuisine === selectedCuisine) {
          // Show the layer
          if (!map.hasLayer(layer)) {
            map.addLayer(layer);
          }
        } else {
          // Hide the layer
          if (map.hasLayer(layer)) {
            map.removeLayer(layer);
          }
        }
      });
      
      // Update table after filtering
      updateTable();
    }

    // Set up filter dropdown
    populateFilter();
    document.getElementById('cuisine-filter').addEventListener('change', function() {
      filterFeatures(this.value);
    });

    // Update table on map move/zoom
    map.on('moveend zoomend', updateTable);

    // Initial table update
    updateTable();

    console.log("Map initialized successfully");

  } catch (e) {
    console.error("Error creating map:", e);
  }
});
