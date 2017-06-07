// MAPBOX CONTROLS

mapboxgl.accessToken = 'pk.eyJ1IjoiYWF1dGVtIiwiYSI6ImNqM21kNHlzYjAwMGMycW5kbGpvcWRsanQifQ.pgAAHuYJxNuOVaIYGB_WkQ';

// initial map setup
var map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/basic-v9',
  center: [0, 40],
  zoom: 1
});

// add zoom controls to map
map.addControl(new mapboxgl.NavigationControl());

map.on('load', function () {
  // add initial 'symbols' layer to add launch pad locations
  map.addLayer({
    id: 'symbols',
    type: 'symbol',
    source: {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    },
    layout: {
      'icon-image': 'rocket-15',
      'icon-allow-overlap': true
    }
  });

  addLaunchPadsToMap();

  // load all rocket information in array of rocket objects
  getRockets().then(function(rockets) {
    // add event handlers
    // handle launch pad click
    map.on('click', 'symbols', function (e) {
      // center launchpad location and zoom in
      map.flyTo({center: e.features[0].geometry.coordinates, zoom: 10});

      // launch pad information
      var props = e.features[0].properties;

      // rockets associated with this launch pad
      var launchPadRockets = [];

      rockets.forEach(function(rocket) {
        if (rocket.defaultPads) {
          // split defaultPads array at commas
          var defaultPads = rocket.defaultPads.split(',');
          defaultPads.forEach(function(id) {
            if (parseInt(id) === props.id) {
              launchPadRockets.push(rocket);
            }
          });
        }
      });

      var htmlString = '<h4>' + props.name + '</h4>';

      if (launchPadRockets.length) {
        launchPadRockets.forEach(function(rocket) {
          htmlString += '<p>' + rocket.name + '</p>';
        });
      } else {
        htmlString += '<p>No rocket information available</p>';
      }

      // add info popup to map location
      new mapboxgl.Popup()
        .setLngLat(e.features[0].geometry.coordinates)
        .setHTML(htmlString)
        .addTo(map);
    });

    // change cursor to pointer on launchpad hover
    map.on('mouseenter', 'symbols', function () {
      map.getCanvas().style.cursor = 'pointer';
    });

    // change cursor to default when mouse leaves launchpad
    map.on('mouseleave', 'symbols', function () {
      map.getCanvas().style.cursor = '';
    });
  });
});


//////////////////////
// HELPER FUNCTIONS //
//////////////////////


// format launch pad objects to be used by map
function createFeatureList(launchPads) {
  return launchPads.map(function(pad) {
    return {
      type: 'Feature',
      properties: {
        id: pad.id,
        name: pad.name,
        agencies: pad.agencies
      },
      geometry: {
        type: 'Point',
        coordinates: [
          pad.longitude,
          pad.latitude
        ]
      }
    };
  });
};


// add feature list to 'symbols' map layer
function addFeaturesToMap(featureList) {
  // concat old feature list with new feature list
  var newFeatureList = map.getSource('symbols')._data.features.concat(featureList);
  // update symbols layer with new feature list
  map.getSource('symbols').setData({
    type: 'FeatureCollection',
    features: newFeatureList
  });
};


// returns 30 launch pad objects at a time
// offset = number (0, 30, 60, 90, 120, etc)
function addLaunchPadsToMap(offset) {
  offset = offset || 0;
  // get launch pads
  return axios.get('https://launchlibrary.net/1.2/pad?mode=verbose&offset=' + offset)
    .then(function(response) {
      return response.data.pads;
    })
    .then(function(launchPads) {
      // create feature list
      if (launchPads.length) {
        return createFeatureList(launchPads);
      }
    })
    .then(function(featureList) {
      var nextPage = false;
      // add features to map
      if (featureList) {
        addFeaturesToMap(featureList);
        nextPage = true;
      }
      return nextPage;
    })
    .then(function(nextPage) {
      // add next page of results to map
      if (nextPage) {
        addLaunchPadsToMap(offset + 30);
      }
    })
    .catch(function(error) {
      console.log(error);
    });
};


// get individual rocket info
function getRockets(offset, rocketList) {
  offset = offset || 0;
  rocketList = rocketList || [];
  return axios.get('https://launchlibrary.net/1.2/rocket?mode=list&offset=' + offset)
    .then(function(response) {
      if (response.data.rockets.length) {
        var newRocketList = rocketList.concat(response.data.rockets);
        return getRockets(offset + 30, newRocketList);
      } else {
        return rocketList;
      }
    })
    .catch(function(error) {
      console.log(error);
    });
};
