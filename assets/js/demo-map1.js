// demo-map1.js - Clean Leaflet Map

document.addEventListener("DOMContentLoaded", function () {
  console.log("Initializing map...");

  var mapDiv = document.getElementById("demo-map");
  if (!mapDiv) {
    console.error("Map container not found!");
    return;
  }

  try {
    // Create map centered on Manhattan, Kansas (K-State area)
    var map = L.map("demo-map").setView([39.19, -96.59], 13);

    // Add MapTiler streets basemap
    L.tileLayer(
      "https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=WcjuUvQEzg8QoDzAiDZB",
      {
        attribution: "© MapTiler © OpenStreetMap contributors",
        maxZoom: 18,
      }
    ).addTo(map);

    console.log("Map initialized successfully");
  } catch (e) {
    console.error("Error creating map:", e);
  }
});
