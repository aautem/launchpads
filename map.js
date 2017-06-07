// MAPBOX CONTROLS

mapboxgl.accessToken = 'pk.eyJ1IjoiYWF1dGVtIiwiYSI6ImNqM21kNHlzYjAwMGMycW5kbGpvcWRsanQifQ.pgAAHuYJxNuOVaIYGB_WkQ';

// initial map settings
var map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/basic-v9',
  center: [0, 40],
  zoom: 1
});

// add zoom controls to map
map.addControl(new mapboxgl.NavigationControl());


/////////////////////////////
// MOVE INTO A HELPER FILE //
/////////////////////////////

var addMapEventHandlers = function() {
  // Center the map on the coordinates of any clicked symbol from the 'symbols' layer.
  map.on('click', 'symbols', function (e) {
    map.flyTo({center: e.features[0].geometry.coordinates, zoom: 8});
    new mapboxgl.Popup()
      .setLngLat(e.features[0].geometry.coordinates)
      .setHTML(e.features[0].properties.description)
      .addTo(map);
  });

  // Change the cursor to a pointer when the it enters a feature in the 'symbols' layer.
  map.on('mouseenter', 'symbols', function () {
    map.getCanvas().style.cursor = 'pointer';
  });

  // Change it back to a pointer when it leaves.
  map.on('mouseleave', 'symbols', function () {
    map.getCanvas().style.cursor = '';
  });
};


var createLayer = function(features) {
  map.addLayer({
    id: 'symbols',
    type: 'symbol',
    source: {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: features,
      }
    },
    layout: {
      'icon-image': 'rocket-15',
      'icon-allow-overlap': true
    }
  });

  addMapEventHandlers();
};

// callback should be anonymous function that calls map.addLayer
// with "features" prop set to returned features array
var createFeatures = function(callback) {
  // AJAX request to get launch pads and locations
  // ONLY RETURNS 30 LAUNCH PADS AT A TIME
  // KEEP MAKING API CALLS UNTIL NO RESPONSE

  axios.get('https://launchlibrary.net/1.2/pad?mode=summary')
  .then(function (response) {
    var features = [];

    response.data.pads.forEach(function(pad) {
      // create 'feature' object
      var feature = {
        type: 'Feature',
        properties: {
          description: '<h4>' + pad.name + '</h4>'
        },
        geometry: {
          type: 'Point',
          coordinates: [
            pad.longitude,
            pad.latitude
          ]
        }
      };
      // push object into 'features' array
      features.push(feature);
    });

    console.log('Features:', features);

    // send features into map.on('load') function
    callback(features);
  })
  .catch(function (error) {
    console.log(error);
  });
};


// run anonymous function when map loads
map.on('load', function () {
  // RUN FUNCTION THAT CREATES A "features" ARRAY OF "FEATURE" OBJECTS (line 25)
  createFeatures(createLayer);

  // Add a symbol layer.
  // map.addLayer({
  //     "id": "symbols",
  //     "type": "symbol",
  //     "source": {
  //         "type": "geojson",
  //         "data": {
  //             "type": "FeatureCollection",
  //             "features": [
  //                 {
  //                     "type": "Feature",
  //                     "properties": {},
  //                     "geometry": {
  //                         "type": "Point",
  //                         "coordinates": [
  //                             -91.395263671875,
  //                             -0.9145729757782163

  //                         ]
  //                     }
  //                 },
  //                 {
  //                     "type": "Feature",
  //                     "properties": {},
  //                     "geometry": {
  //                         "type": "Point",
  //                         "coordinates": [
  //                             -90.32958984375,
  //                             -0.6344474832838974
  //                         ]
  //                     }
  //                 },
  //                 {
  //                     "type": "Feature",
  //                     "properties": {},
  //                     "geometry": {
  //                         "type": "Point",
  //                         "coordinates": [
  //                             -91.34033203125,
  //                             0.01647949196029245
  //                         ]
  //                     }
  //                 }
  //             ]
  //         }
  //     },
  //     "layout": {
  //         "icon-image": "rocket-15",
  //         "icon-allow-overlap": true
  //     }
  // });

  // // Center the map on the coordinates of any clicked symbol from the 'symbols' layer.
  // map.on('click', 'symbols', function (e) {
  //     map.flyTo({center: e.features[0].geometry.coordinates, zoom: 8});
  //     new mapboxgl.Popup()
  //       .setLngLat(e.features[0].geometry.coordinates)
  //       .setHTML('Hello World!')
  //       .addTo(map);
  // });

  // // Change the cursor to a pointer when the it enters a feature in the 'symbols' layer.
  // map.on('mouseenter', 'symbols', function () {
  //     map.getCanvas().style.cursor = 'pointer';
  // });

  // // Change it back to a pointer when it leaves.
  // map.on('mouseleave', 'symbols', function () {
  //     map.getCanvas().style.cursor = '';
  // });
});
