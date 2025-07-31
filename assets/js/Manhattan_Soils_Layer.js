var Soils = L.esri.featureLayer({
  url: "https://gis.rileycountyks.gov/arcgis/rest/services/GISWeb/Agricultural/MapServer/10",
  pane: "soilsPane",
  minZoom: 15,
  where: "1=1",
  maxFeatures: 5000,
  style: {
    color: "yellow",
    weight: 2,
    fillColor: "transparent",
    fillOpacity: 0,
  },
});
