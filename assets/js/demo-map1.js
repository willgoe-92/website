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

    // Create map panes for layer ordering
    map.createPane("soilsPane");
    map.getPane("soilsPane").style.zIndex = 400;
    map.createPane("parcelsPane");
    map.getPane("parcelsPane").style.zIndex = 450;

    // GeoJSON data embedded directly in this file
    const displayPointsData = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          id: 1,
          geometry: {
            type: "Point",
            coordinates: [-76.993370753164555, 38.989181279126925],
          },
          properties: {
            OBJECTID: 1,
            Address: "8011 Carroll Ave Takoma Park MD, 20912",
            Name: "Elliot Goe",
            Date: "2025-08-11",
          },
        },
      ],
    };

    // Create Display Points layer
    var displayPointsLayer = L.geoJSON(displayPointsData, {
      pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng, {
          radius: 8,
          fillColor: "#ff7800",
          color: "#fff",
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8,
        });
      },
      onEachFeature: function (feature, layer) {
        if (feature.properties) {
          let popupContent = "<strong>Display Point</strong><br>";
          Object.keys(feature.properties).forEach((key) => {
            popupContent += `<strong>${key}:</strong> ${feature.properties[key]}<br>`;
          });
          layer.bindPopup(popupContent);
        }
      },
    });

    // Add layers to map first
    Soils.addTo(map);
    Parcels.addTo(map);
    displayPointsLayer.addTo(map);

    // Use standard Leaflet layer control for simple checkboxes
    var overlayMaps = {
      "Soil Information": Soils,
      "Property Parcels": Parcels,
    };

    // Create standard layer control with checkboxes
    var layerControl = L.control.layers(null, overlayMaps, {
      position: "topright",
      collapsed: false,
    });

    // Add the standard layer control to the map
    layerControl.addTo(map);

    console.log("Map initialized successfully");
    console.log("Layer control added:", layerControl);

    // Optional: Add event listeners for layer changes
    map.on("overlayadd", function (e) {
      console.log("Layer added:", e.name);
    });

    map.on("overlayremove", function (e) {
      console.log("Layer removed:", e.name);
    });
  } catch (e) {
    console.error("Error creating map:", e);
  }
});
