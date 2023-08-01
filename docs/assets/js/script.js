// Check to see if ticketmaster data exists before pulling api again.
var ticketmasterData = localStorage.getItem("ticketmasterData") ? JSON.parse(localStorage.getItem("ticketmasterData")) : getEventData();

console.log(ticketmasterData);

// Get ticketmaster api data and store to localstorage for future use.
async function getEventData(location) {
    console.log("Getting Ticket Master Data");
    await fetch("https://app.ticketmaster.com/discovery/v2/events.json?&apikey=" + ticketmasterAPI)
        .then(response => {
            return response.json();
        }).then(data => {
            localStorage.setItem("ticketmasterData", JSON.stringify(data));
        })
}
var platform = new H.service.Platform({
    'apikey': hereAPI
  });
  // Obtain the default map types from the platform object:
var defaultLayers = platform.createDefaultLayers();

var apiURL = "https://1.base.maps.ls.hereapi.com/maptile/2.1/maptile/newest/normal.day/13/4400/2686/256/png8?apiKey={YOUR_API_KEY}"

// Instantiate (and display) a map object:
var map = new H.Map(
    document.getElementById('mapContainer'),
    defaultLayers.vector.normal.map,
    {
      zoom: 10,
      center: { lat: 52.5, lng: 13.4 }
    });