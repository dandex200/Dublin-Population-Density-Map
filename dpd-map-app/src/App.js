import React, { useEffect, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css'; // Leaflet CSS
import './App.css'; // Custom CSS for the map container

function App() {
  const [map, setMap] = useState(null);
  const [boundariesLayer, setBoundariesLayer] = useState(null);
  const [choroplethLayer, setChoroplethLayer] = useState(null);
  const [isChoroplethActive, setIsChoroplethActive] = useState(false);

  useEffect(() => {
    const dublinCoords = [53.3498, -6.2603]; // Latitude, Longitude

    const mapInstance = L.map('map').setView(dublinCoords, 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(mapInstance);

    setMap(mapInstance);

    fetch('/layers/Dublin_SA1_TOTALPOP_DEN.geojson') // Update path if necessary
      .then(response => response.json())
      .then(data => {
        // Create boundaries layer
        const boundariesLayer = L.geoJSON(data, {
          style: {
            color: 'black',
            weight: 0.5,
            fillOpacity: 0
          },
          onEachFeature: (feature, layer) => {
            layer.on('click', function () {
              if (!isChoroplethActive) {
                // Reset all layers to greyed-out state
                boundariesLayer.eachLayer(l => {
                  l.setStyle({
                    color: 'grey',
                    weight: 0.5,
                    fillOpacity: 0.2
                  });
                });

                // Highlight the clicked feature
                layer.setStyle({
                  color: 'red',
                  weight: 2,
                  fillOpacity: 0.5
                });

                // Bind popup with population data
                layer.bindPopup(`Total Population: ${feature.properties.total_pop}<br>Density: ${feature.properties.equalized_density.toFixed(4)}`).openPopup();
              } else {
                // In choropleth mode, just show the popup without changing styles
                layer.bindPopup(`Total Population: ${feature.properties.total_pop}<br>Density: ${feature.properties.equalized_density.toFixed(4)}`).openPopup();
              }
            });
          }
        });

        setBoundariesLayer(boundariesLayer);
        boundariesLayer.addTo(mapInstance);

        // Create choropleth layer
        const choroplethLayer = L.geoJSON(data, {
          style: feature => {
            const density = feature.properties.equalized_density;
            return {
              fillColor: getColor(density),
              weight: 0.5,
              opacity: 1,
              color: 'white',
              fillOpacity: 0.7 // Adjust opacity for better visibility
            };
          },
          onEachFeature: (feature, layer) => {
            layer.on('click', function () {
              layer.bindPopup(`Total Population: ${feature.properties.total_pop}<br>Density: ${feature.properties.equalized_density.toFixed(4)}`).openPopup();
            });
          }
        });

        setChoroplethLayer(choroplethLayer);

        // Reset styles when popup is closed
        mapInstance.on('popupclose', () => {
          if (!isChoroplethActive) {
            boundariesLayer.eachLayer(l => {
              l.setStyle({
                color: 'black',
                weight: 0.5,
                fillOpacity: 0
              });
            });
          }
        });
      })
      .catch(error => console.error('Error loading boundaries:', error));

    return () => {
      mapInstance.remove();
    };
  }, []); // Empty dependency array ensures this runs only once

  const toggleChoropleth = () => {
    if (!map || !boundariesLayer || !choroplethLayer) {
      console.error("Map or layers are not initialized yet.");
      return;
    }

    if (isChoroplethActive) {
      map.removeLayer(choroplethLayer);
      boundariesLayer.addTo(map);
    } else {
      map.removeLayer(boundariesLayer);
      choroplethLayer.addTo(map);
    }
    setIsChoroplethActive(!isChoroplethActive);
  };

  const getColor = (density) => {
    if (density <= 0.02) return '#f2f0f7';
    if (density <= 0.04) return '#cbc9e2';
    if (density <= 0.06) return '#9e9ac8';
    if (density <= 0.08) return '#756bb1';
    return '#54278f';
  };

  return (
    <div className="App">
      <h1>Dublin Population Density Rail Map</h1>
      <button onClick={toggleChoropleth}>
        {isChoroplethActive ? 'Show Boundaries' : 'Show Choropleth'}
      </button>
      <div className="map-container">
        <div id="map"></div> {/* Leaflet map container */}
      </div>
    </div>
  );
}

export default App;