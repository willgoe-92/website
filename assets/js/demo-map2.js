// JSONBin configuration
const JSONBIN_CONFIG = {
  binId: "68cc599343b1c97be94779b8",
  apiKey: "$2a$10$oCZEFoL6ke394dMwV1Y1e.kLpGqcuo0bbVD7iJaociIqOHvG3DQsK",
  baseUrl: "https://api.jsonbin.io/v3/b/",
};

// Global variables
let takomaParkMap;
let takomaParkData = [];
let takomaParkMarkers = [];
let isCreatingPoint = false;
let pendingPointLocation = null;

// Initialize Takoma Park map when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM loaded, initializing Takoma Park map...");
  initializeMap();
  fetchDisplayPoints();
  setupUIControls();
});

// Initialize the map
function initializeMap() {
  console.log("Initializing map...");
  const mapElement = document.getElementById("takoma-park-map");
  console.log("Map element found:", mapElement);

  if (!mapElement) {
    console.error("Map element not found!");
    return;
  }

  try {
    // DMV area center (roughly between DC, Maryland, Virginia): 38.9072, -77.0369
    takomaParkMap = L.map("takoma-park-map", {
      center: [38.9072, -77.0369],
      zoom: 10,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    console.log("Map created successfully");

    // Add MapTiler streets basemap (same as demo-map1)
    L.tileLayer(
      "https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=WcjuUvQEzg8QoDzAiDZB",
      {
        attribution: "© MapTiler © OpenStreetMap contributors",
        maxZoom: 20,
      }
    ).addTo(takomaParkMap);

    console.log("Tile layer added");

    // Add Nominatim geocoder control without blue box
    const geocoder = L.Control.Geocoder.nominatim({
      geocodingQueryParams: {
        countrycodes: "us",
        bounded: 1,
        viewbox: "-77.5,38.5,-76.5,39.5", // Bounding box around DMV area
      },
    });

    L.Control.geocoder({
      geocoder: geocoder,
      defaultMarkGeocode: false,
      placeholder: "Search for address...",
      errorMessage: "Address not found",
    })
      .on("markgeocode", function (e) {
        // Simply zoom to the location without showing a blue box
        const latlng = e.geocode.center;
        takomaParkMap.setView(latlng, 18);
      })
      .addTo(takomaParkMap);

    console.log("Geocoder added");

    // Add click event for point creation (only when in creation mode)
    takomaParkMap.on("click", function (e) {
      if (isCreatingPoint) {
        handleMapClick(e.latlng);
      }
    });

    console.log("Map initialization complete");
  } catch (error) {
    console.error("Error initializing map:", error);
  }
}

// Fetch data from JSONBin
async function fetchDisplayPoints() {
  console.log("Fetching data from JSONBin...");
  try {
    const response = await fetch(
      `${JSONBIN_CONFIG.baseUrl}${JSONBIN_CONFIG.binId}`,
      {
        method: "GET",
        headers: {
          "X-Access-Key": JSONBIN_CONFIG.apiKey,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Response status:", response.status);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Raw response data:", data);

    takomaParkData = data.record || data; // Handle different response formats
    console.log("Processed data:", takomaParkData);
    console.log("Data type:", typeof takomaParkData);
    console.log("Is array:", Array.isArray(takomaParkData));

    displayDataOnMap();
  } catch (error) {
    console.error("Error fetching display points:", error);
    // Show user-friendly error message
    alert(
      "Failed to load data from JSONBin. Please check your connection and try again."
    );
  }
}

// Display data points on the map
function displayDataOnMap() {
  console.log("Displaying data on map...");
  console.log("Current data:", takomaParkData);

  // Clear existing markers
  takomaParkMarkers.forEach((marker) => takomaParkMap.removeLayer(marker));
  takomaParkMarkers = [];

  // Handle GeoJSON format
  let featuresArray = [];
  if (
    takomaParkData.type === "FeatureCollection" &&
    Array.isArray(takomaParkData.features)
  ) {
    featuresArray = takomaParkData.features;
    console.log("Data is GeoJSON FeatureCollection, using features array");
  } else if (Array.isArray(takomaParkData)) {
    featuresArray = takomaParkData;
    console.log("Data is array, using directly");
  } else if (takomaParkData.points && Array.isArray(takomaParkData.points)) {
    featuresArray = takomaParkData.points;
    console.log("Data has points property, using that");
  } else {
    console.log("Unknown data structure:", takomaParkData);
    console.log("Available properties:", Object.keys(takomaParkData || {}));
    return;
  }

  console.log("Features array:", featuresArray);
  console.log("Number of features:", featuresArray.length);

  // Add markers for each feature
  featuresArray.forEach((feature, index) => {
    console.log(`Processing feature ${index}:`, feature);

    let lat, lng;

    // Handle GeoJSON format
    if (
      feature.type === "Feature" &&
      feature.geometry &&
      feature.geometry.type === "Point"
    ) {
      // GeoJSON Point coordinates are [longitude, latitude]
      lng = feature.geometry.coordinates[0];
      lat = feature.geometry.coordinates[1];
      console.log(
        `GeoJSON feature ${index} coordinates: lat=${lat}, lng=${lng}`
      );
    } else {
      // Handle simple lat/lng format
      lat = feature.lat || feature.latitude || feature.y;
      lng = feature.lng || feature.lon || feature.longitude || feature.x;
      console.log(
        `Simple feature ${index} coordinates: lat=${lat}, lng=${lng}`
      );
    }

    if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
      console.log(`Creating marker for feature ${index} at [${lat}, ${lng}]`);
      
      // Create custom red food marker
      const foodIcon = L.divIcon({
        className: 'custom-food-marker',
        html: '<div class="marker-pin"><div class="marker-icon">🍴</div></div>',
        iconSize: [30, 40],
        iconAnchor: [15, 40],
        popupAnchor: [0, -40]
      });
      
      const marker = L.marker([lat, lng], { icon: foodIcon })
        .addTo(takomaParkMap)
        .bindPopup(createPopupContent(feature, index));

      takomaParkMarkers.push(marker);
      console.log(`Marker ${index} added successfully`);
    } else {
      console.log(
        `Feature ${index} missing or invalid coordinates - lat: ${lat}, lng: ${lng}`
      );
    }
  });

  console.log(`Total markers created: ${takomaParkMarkers.length}`);
}

// Create popup content for a point
function createPopupContent(feature, index) {
  let restaurantName, address, cuisine, favoriteDish, recommendedBy, date;

  // Handle GeoJSON format
  if (feature.type === "Feature" && feature.properties) {
    restaurantName =
      feature.properties["Restaurant Name"] ||
      feature.properties.Name ||
      `Restaurant ${index + 1}`;
    address =
      feature.properties["Restaurant Address"] ||
      feature.properties.Address ||
      "";
    cuisine = feature.properties.Cuisine || "";
    favoriteDish = feature.properties["Favorite Dish"] || "";
    recommendedBy = feature.properties["Recommended By"] || "";
    date = feature.properties.Date || "";
  } else {
    // Handle simple object format
    restaurantName =
      feature.restaurantName || feature.name || `Restaurant ${index + 1}`;
    address = feature.address || "";
    cuisine = feature.cuisine || "";
    favoriteDish = feature.favoriteDish || "";
    recommendedBy = feature.recommendedBy || "";
    date = feature.date || "";
  }

  let content = `<div class="point-popup"><h4>${restaurantName}</h4>`;

  if (address) content += `<p><strong>Address:</strong> ${address}</p>`;
  if (cuisine) content += `<p><strong>Cuisine:</strong> ${cuisine}</p>`;
  if (favoriteDish)
    content += `<p><strong>Favorite Dish:</strong> ${favoriteDish}</p>`;
  if (recommendedBy)
    content += `<p><strong>Recommended By:</strong> ${recommendedBy}</p>`;
  if (date) content += `<p><strong>Date Added:</strong> ${date}</p>`;

  content += `</div>`;

  return content;
}

// Setup UI controls
function setupUIControls() {
  const createBtn = document.getElementById("create-point-btn");
  const modal = document.getElementById("create-point-modal");
  const closeBtn = document.getElementById("close-modal");
  const cancelBtn = document.getElementById("cancel-point");
  const form = document.getElementById("create-point-form");

  // Create Point button click - toggle creation mode
  createBtn.addEventListener("click", function () {
    if (isCreatingPoint) {
      exitCreationMode();
    } else {
      enterCreationMode();
    }
  });

  // Close modal
  closeBtn.addEventListener("click", exitCreationMode);
  cancelBtn.addEventListener("click", exitCreationMode);

  // Form submission
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    submitNewPoint();
  });

  // Close modal when clicking outside
  modal.addEventListener("click", function (e) {
    if (e.target === modal) {
      exitCreationMode();
    }
  });
}

// Enter point creation mode
function enterCreationMode() {
  isCreatingPoint = true;

  // Change map cursor to indicate creation mode
  takomaParkMap.getContainer().style.cursor = "crosshair";

  // Show instruction message or change button text
  const createBtn = document.getElementById("create-point-btn");
  createBtn.textContent = "Cancel Plotting";
  createBtn.disabled = false;

  console.log("Entered creation mode - click on the map to place a point");
}

// Exit point creation mode
function exitCreationMode() {
  isCreatingPoint = false;
  pendingPointLocation = null;
  const modal = document.getElementById("create-point-modal");
  modal.style.display = "none";

  // Reset map cursor
  takomaParkMap.getContainer().style.cursor = "";

  // Reset button
  const createBtn = document.getElementById("create-point-btn");
  createBtn.textContent = "Share A Rec!";
  createBtn.disabled = false;

  console.log("Exited creation mode");
}

// Handle map click during creation mode
function handleMapClick(latlng) {
  pendingPointLocation = latlng;
  console.log("Point location selected:", latlng);

  // Reset map cursor to normal
  takomaParkMap.getContainer().style.cursor = "";

  // Reset button
  const createBtn = document.getElementById("create-point-btn");
  createBtn.textContent = "Share A Rec!";
  createBtn.disabled = false;

  // Show the modal form
  const modal = document.getElementById("create-point-modal");
  modal.style.display = "flex";

  // Clear any previous form data
  document.getElementById("create-point-form").reset();

  // Ensure form inputs are enabled
  const restaurantNameInput = document.getElementById("restaurant-name");
  const restaurantAddressInput = document.getElementById("restaurant-address");
  const cuisineInput = document.getElementById("cuisine");
  const favoriteDishInput = document.getElementById("favorite-dish");
  const recommendedByInput = document.getElementById("recommended-by");

  restaurantNameInput.disabled = false;
  restaurantNameInput.readOnly = false;
  restaurantAddressInput.disabled = false;
  restaurantAddressInput.readOnly = false;
  cuisineInput.disabled = false;
  cuisineInput.readOnly = false;
  favoriteDishInput.disabled = false;
  favoriteDishInput.readOnly = false;
  recommendedByInput.disabled = false;
  recommendedByInput.readOnly = false;

  console.log("Form inputs enabled and ready");

  // Focus on the restaurant name field after a short delay to ensure modal is fully rendered
  setTimeout(() => {
    restaurantNameInput.focus();
    console.log("Focus set to restaurant name input");
  }, 200);
}

// Submit new point
function submitNewPoint() {
  if (!pendingPointLocation) {
    alert("Please click on the map to select a location first.");
    return;
  }

  const restaurantName = document
    .getElementById("restaurant-name")
    .value.trim();
  const restaurantAddress = document
    .getElementById("restaurant-address")
    .value.trim();
  const cuisine = document.getElementById("cuisine").value.trim();
  const favoriteDish = document.getElementById("favorite-dish").value.trim();
  const recommendedBy = document.getElementById("recommended-by").value.trim();

  if (
    !restaurantName ||
    !restaurantAddress ||
    !cuisine ||
    !favoriteDish ||
    !recommendedBy
  ) {
    alert("All fields are required.");
    return;
  }

  // Create new GeoJSON feature with auto-filled timestamp
  const now = new Date();
  const dateString = now.toISOString().split("T")[0]; // YYYY-MM-DD format

  const newFeature = {
    type: "Feature",
    id: Date.now(),
    geometry: {
      type: "Point",
      coordinates: [pendingPointLocation.lng, pendingPointLocation.lat], // GeoJSON format: [longitude, latitude]
    },
    properties: {
      OBJECTID: Date.now(),
      "Restaurant Name": restaurantName,
      "Restaurant Address": restaurantAddress,
      Cuisine: cuisine,
      "Favorite Dish": favoriteDish,
      "Recommended By": recommendedBy,
      Date: dateString,
    },
  };

  // Add to features array
  if (
    takomaParkData.type === "FeatureCollection" &&
    Array.isArray(takomaParkData.features)
  ) {
    takomaParkData.features.push(newFeature);
  } else {
    // Create new FeatureCollection if needed
    takomaParkData = {
      type: "FeatureCollection",
      features: [newFeature],
    };
  }

  // Save to JSONBin and refresh display
  saveDisplayPoints();

  // Exit creation mode
  exitCreationMode();

  console.log("New point created:", newFeature);
}

// Save data back to JSONBin
async function saveDisplayPoints() {
  try {
    console.log("Attempting to save data:", takomaParkData);
    console.log("Using API key:", JSONBIN_CONFIG.apiKey);
    console.log("Bin ID:", JSONBIN_CONFIG.binId);

    const response = await fetch(
      `${JSONBIN_CONFIG.baseUrl}${JSONBIN_CONFIG.binId}`,
      {
        method: "PUT",
        headers: {
          "X-Access-Key": JSONBIN_CONFIG.apiKey,
          "Content-Type": "application/json",
          "X-Bin-Meta": "false",
        },
        body: JSON.stringify(takomaParkData),
      }
    );

    console.log("Response status:", response.status);
    console.log("Response headers:", response.headers);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error response:", errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log("Save result:", result);
    console.log("Data saved successfully");
    displayDataOnMap(); // Refresh the display
  } catch (error) {
    console.error("Error saving display points:", error);
    alert(
      "Failed to save data. Please check the console for details and verify your API key."
    );
  }
}
