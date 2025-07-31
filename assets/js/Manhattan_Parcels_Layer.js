var Parcels = L.esri.featureLayer({
  url: "https://gis.rileycountyks.gov/arcgis/rest/services/GISWeb/BasemapAerial22/MapServer/5",
  pane: "parcelsPane",
  minZoom: 15,
  where: "1=1",
  maxFeatures: 5000,
  style: {
    color: "rgba(102, 101, 100)",
    weight: 1.5,
    fillColor: "transparent",
    fillOpacity: 0.5,
  },
});
