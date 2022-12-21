/* eslint-disable */

export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1Ijoib3NtYW43ODYiLCJhIjoiY2xhOGY5d3VyMDJoczNvbnZpdGI0eDJiNSJ9.EYSlAQKesirYTHeEIi2wtg';
  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v10',
    scrollZoom: false,
    //   center: [-118.113491, 34.111745],
    //   zoom: 10,
    //by interactive map cannot be moved.
    // interactive: false,
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    //Create Marker
    const el = document.createElement('div');
    el.className = 'marker';

    //Add Marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    new mapboxgl.Popup({
      offset: 30,
    })
      .setLngLat(loc.coordinates)
      .setHTML(
        `<p>
        Day ${loc.day}: ${loc.description}
      </p>`
      )
      .addTo(map);

    //Extend map bounds to include current location
    bounds.extend(loc.coordinates);
  });

  //To fit map to all bounds/coordinates.
  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 200,
      left: 200,
      right: 200,
    },
  });

  //To add Zoom Buttons
  const nav = new mapboxgl.NavigationControl();
  map.addControl(nav, 'top-right');
};
