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

    // Function to get cuisine type, color, and icon
    function getCuisineStyle(feature) {
      const cuisine = feature.properties.cuisine || 'cafe';
      
      const cuisineConfig = {
        'mexican': { color: '#E74C3C', icon: '🌮' },        // Red
        'american': { color: '#3498DB', icon: '🍔' },       // Blue  
        'italian': { color: '#27AE60', icon: '🍝' },        // Green
        'chinese': { color: '#F39C12', icon: '🥡' },        // Orange
        'japanese': { color: '#9B59B6', icon: '🍣' },       // Purple
        'indian': { color: '#E67E22', icon: '🍛' },         // Dark Orange
        'thai': { color: '#1ABC9C', icon: '🍜' },           // Teal
        'pizza': { color: '#E74C3C', icon: '🍕' },          // Red
        'burger': { color: '#3498DB', icon: '🍔' },         // Blue
        'sandwich': { color: '#F1C40F', icon: '🥪' },       // Yellow
        'coffee': { color: '#8B4513', icon: '☕' },         // Brown
        'ice_cream': { color: '#FFB6C1', icon: '🍦' },      // Light Pink
        'bakery': { color: '#DEB887', icon: '🥐' },         // Tan
        'seafood': { color: '#20B2AA', icon: '🦐' },        // Light Sea Green
        'steak_house': { color: '#8B0000', icon: '🥩' },    // Dark Red
        'barbecue': { color: '#CD853F', icon: '🍖' },       // Peru
        'fast_food': { color: '#FF4500', icon: '🍟' },      // Orange Red
        'cafe': { color: '#6F4E37', icon: '☕' },           // Coffee Brown (default)
        // New/Updated cuisine types
        'breakfast': { color: '#F39C12', icon: '🥞' },      // Orange - pancakes
        'chicken': { color: '#FF6347', icon: '🐔' },        // Tomato - chicken
        'cookie': { color: '#D2691E', icon: '🍪' },         // Chocolate - cookie
        'donut': { color: '#FF69B4', icon: '🍩' },          // Hot Pink - donut
        'juice': { color: '#32CD32', icon: '🧃' },          // Lime Green - juice
        'mongolian_grill': { color: '#CD853F', icon: '🍖' }, // Peru - same as barbecue
        'pasta': { color: '#27AE60', icon: '🍝' },          // Green - same as italian
        'pretzel': { color: '#8B4513', icon: '🥨' },        // Saddle Brown - pretzel
        'salad': { color: '#228B22', icon: '🥗' },          // Forest Green - salad
        'steak': { color: '#CD853F', icon: '🍖' },          // Peru - same as barbecue
        'sushi': { color: '#9B59B6', icon: '🍣' },          // Purple - same as japanese
        'tex-mex': { color: '#E74C3C', icon: '🌮' },        // Red - same as mexican
        'wings': { color: '#FF6347', icon: '🐔' }           // Tomato - same as chicken
      };

      const config = cuisineConfig[cuisine] || cuisineConfig['cafe'];
      return {
        color: config.color,
        icon: config.icon,
        cuisine: cuisine
      };
    }

    // Create Display Points layer using converted data (all as points)
    var displayPointsLayer = L.geoJSON(convertedDisplayPointsData, {
      pointToLayer: function (feature, latlng) {
        // All features are now points
        const style = getCuisineStyle(feature);
        
        // Create custom HTML marker with icon and styling
        const markerHtml = `
          <div class="custom-marker" style="background-color: ${style.color}">
            <div class="marker-icon">${style.icon}</div>
            <div class="marker-pulse" style="background-color: ${style.color}"></div>
          </div>
        `;
        
        const customIcon = L.divIcon({
          html: markerHtml,
          className: 'custom-marker-wrapper',
          iconSize: [40, 40],
          iconAnchor: [20, 35],
          popupAnchor: [0, -35]
        });
        
        return L.marker(latlng, { icon: customIcon });
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
    let selectedCuisines = new Set(); // Use Set to store multiple selected cuisines

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

      // Filter features based on selected cuisines
      let filteredFeatures = featuresInView;
      if (selectedCuisines.size > 0) {
        filteredFeatures = featuresInView.filter(feature => {
          const cuisine = feature.properties.cuisine || 'cafe';
          return selectedCuisines.has(cuisine);
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
        
        // Make the row clickable
        row.classList.add('clickable-row');
        row.style.cursor = 'pointer';
        
        row.innerHTML = `
          <td>${name}</td>
          <td><span class="cuisine-cell" style="background-color: ${cuisineColor}">${cuisine.replace('_', ' ')}</span></td>
          <td>${hours}</td>
          <td>${phone}</td>
        `;
        
        // Add click event to zoom to restaurant
        row.addEventListener('click', function() {
          const coords = feature.geometry.coordinates;
          const latlng = L.latLng(coords[1], coords[0]);
          
          // Zoom to the restaurant location
          map.setView(latlng, 17);
          
          // Find and open the popup for this restaurant
          displayPointsLayer.eachLayer(layer => {
            if (layer.feature === feature) {
              layer.openPopup();
            }
          });
        });
        
        tbody.appendChild(row);
      });
    }

    // Function to populate filter checkboxes
    function populateFilter() {
      const container = document.getElementById('cuisine-checkboxes');
      const allCuisines = new Set();
      
      convertedDisplayPointsData.features.forEach(feature => {
        const cuisine = feature.properties.cuisine || 'cafe';
        allCuisines.add(cuisine);
      });
      
      // Clear existing checkboxes
      container.innerHTML = '';
      
      // Add cuisine checkboxes
      Array.from(allCuisines).sort().forEach(cuisine => {
        const checkboxWrapper = document.createElement('div');
        checkboxWrapper.className = 'checkbox-item';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `cuisine-${cuisine}`;
        checkbox.value = cuisine;
        checkbox.className = 'cuisine-checkbox';
        
        const label = document.createElement('label');
        label.htmlFor = `cuisine-${cuisine}`;
        label.textContent = cuisine.replace('_', ' ');
        
        checkboxWrapper.appendChild(checkbox);
        checkboxWrapper.appendChild(label);
        container.appendChild(checkboxWrapper);
        
        // Add event listener
        checkbox.addEventListener('change', function() {
          if (this.checked) {
            selectedCuisines.add(cuisine);
          } else {
            selectedCuisines.delete(cuisine);
          }
          updateSelectedCount();
          filterFeatures();
        });
      });
    }

    // Function to filter features
    function filterFeatures() {
      displayPointsLayer.eachLayer(layer => {
        const feature = layer.feature;
        const cuisine = feature.properties.cuisine || 'cafe';
        
        if (selectedCuisines.size === 0 || selectedCuisines.has(cuisine)) {
          // Show the layer if no filters selected or cuisine matches
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

    // Set up filter checkboxes and buttons
    populateFilter();
    
    // Dropdown toggle functionality
    document.getElementById('cuisine-dropdown-btn').addEventListener('click', function() {
      const container = document.querySelector('.dropdown-container');
      container.classList.toggle('active');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
      const container = document.querySelector('.dropdown-container');
      if (!container.contains(e.target)) {
        container.classList.remove('active');
      }
    });
    
    // Update selected count display
    function updateSelectedCount() {
      const countSpan = document.getElementById('selected-count');
      const count = selectedCuisines.size;
      
      if (count === 0) {
        countSpan.textContent = 'All Cuisines';
      } else if (count === 1) {
        const selected = Array.from(selectedCuisines)[0];
        countSpan.textContent = selected.replace('_', ' ');
      } else {
        countSpan.textContent = `${count} cuisines selected`;
      }
    }
    
    
    // Clear All button functionality
    document.getElementById('clear-all-cuisines').addEventListener('click', function() {
      const checkboxes = document.querySelectorAll('.cuisine-checkbox');
      selectedCuisines.clear();
      
      checkboxes.forEach(checkbox => {
        checkbox.checked = false;
      });
      
      updateSelectedCount();
      filterFeatures();
    });

    // Update table on map move/zoom
    map.on('moveend zoomend', updateTable);

    // Initial table and stats update
    updateTable();

    console.log("Map initialized successfully");

  } catch (e) {
    console.error("Error creating map:", e);
  }
});
