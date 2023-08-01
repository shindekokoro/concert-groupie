var searchInput = document.querySelector("#cityList");

var platform = new H.service.Platform({
    'apikey': hereAPI
});

// Obtain the default map types from the platform object:
const defaultLayers = platform.createDefaultLayers();

// Instantiate (and display) a map:
const map = new H.Map(
    document.getElementById("mapContainer"),
    // Center the map on Dublin, Republic of Ireland, with the zoom level of 10:
    defaultLayers.vector.normal.map, {
    zoom: 14,
    center: {
        lat: 40.76,
        lng: -111.89
    }
});
// add a resize listener to make sure that the map occupies the whole container
window.addEventListener('resize', () => map.getViewPort().resize());


// MapEvents enables the event system.
// The behavior variable implements default interactions for pan/zoom (also on mobile touch environments).
const behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map));
// Create the default UI:
const ui = H.ui.UI.createDefault(map, defaultLayers);
const mapSettingsControl = ui.getControl("mapsettings");
mapSettingsControl.setVisibility(false);

// Get ticketmaster api data and store to sessionStorage for future use.
// Session storage because there is no limit to storage and will clear out old events in different sessions.
async function getEventData(location) {
    // Sources available are: Ticketmaster, Universe, FrontGate Tickets and Ticketmaster Resale (TMR)
    // Multiple, comma separated values are OK.
    const eventsURI = "https://app.ticketmaster.com/discovery/v2/events.json";
    const eventClassification = "music";
    const source = "Ticketmaster";
    const radius = 100;
    const unit = "miles";
    if (sessionStorage.getItem(location)) {
        console.log("Found Data in sessionStorage");
        return await JSON.parse(sessionStorage.getItem(location));
    } else {
        var fetchRequest = `${eventsURI}?classificationName=${eventClassification}&latlong=${location}&source=${source}&radius=${radius}&unit=${unit}&apikey=${ticketmasterAPI}`;
        var response = await fetch(fetchRequest);
        var data = await response.json();
        sessionStorage.setItem(location, JSON.stringify(data));
        return data;
    }
}

// Get ticketmaster venue data and store to localStorage for future use.
// Venue data should rarely if ever change making for less api use on the user side
async function getVenueData(venueLink) {
    if (localStorage.getItem(venueLink)) {
        console.log(JSON.parse(localStorage.getItem(venueLink)));
        return await JSON.parse(localStorage.getItem(venueLink));
    } else {
        var fetchRequest = `https://app.ticketmaster.com/${venueLink}&apikey=${ticketmasterAPI}`;
        console.log(fetchRequest);
        var response = await fetch(fetchRequest);
        var data = await response.json();
        localStorage.setItem(venueLink, JSON.stringify(data));
        return data;
    }
}

function displayVenues(eventData) {
    const eventCoordinates = {
        lat: eventData._embedded.venues[0].location.latitude,
        lng: eventData._embedded.venues[0].location.longitude
    };
    // Center map based off of current event coordinates
    map.setCenter(eventCoordinates);
    console.log(eventData);
    // Create an list of information.
    var eventList = document.getElementById("eventList");
    var li = document.createElement("li");
    li.setAttribute("class", "button is-primary is-outlined")
    li.setAttribute("id", eventData.id)
    li.textContent = eventData.name + " at " + eventData._embedded.venues[0].name;
    eventList.appendChild(li);

    // Create an event listener to create map bubble instead of creating a map bubble for all events
    li.addEventListener("click", () => {
        displayMapBubble(eventData)
        localStorage.setItem(eventData.id, JSON.stringify(eventData))
    });
}

function displayMapBubble(eventData) {

    const eventCoordinates = {
        lat: eventData._embedded.venues[0].location.latitude,
        lng: eventData._embedded.venues[0].location.longitude
    };
    map.setCenter(eventCoordinates);

    // Create the HTML content for the info bubble
    const content = '<div class="has-text-left" style="width:230px">' +
        '<h3><strong>Group:</strong> ' + eventData.name + '</h3>' +
        '<p><strong>Location:</strong> ' + eventData._embedded.venues[0].name + '</p>' +
        '<p><strong>Date:</strong> ' + eventData.dates.start.localDate + '</p>' +
        '<p><a href="' + eventData.url + '">Link to Event</a></p>' +
        '</div>';

    // Create an info bubble at the Spire of Dublin location with the HTML content
    const infoBubble = new H.ui.InfoBubble(eventCoordinates, {
        content
    });

    // Add the info bubble to the UI
    ui.addBubble(infoBubble);
}

function clearEventList() {
    var eventList = document.getElementById("eventList");

    var event = eventList.firstElementChild;
    while (event) {
        // console.log(`Event ${event} deleted`);
        eventList.removeChild(event);
        event = eventList.firstElementChild;
    }
}


// JQuery AutoComplete
$("#cityList").autocomplete({
    source: function (request, response) {
        $.getJSON("assets/js/us.cities.json", function (data) {
            response($.map(data, function (value) {
                var formattedLocation = value.name;
                var searchLocation = value.name;
                if (value.state) {
                    formattedLocation += ", " + value.state;
                    searchLocation += " " + value.state;
                }
                if (value.country) {
                    formattedLocation += ", " + value.country;
                    searchLocation += " " + value.country;
                }
                if (searchLocation.toLowerCase().includes(request.term.toLowerCase())) {
                    var formattedLocation = value.name;
                    if (value.state) {
                        formattedLocation += ", " + value.state;
                    }
                    if (value.country) {
                        formattedLocation += ", " + value.country;
                    }
                    return [{
                        label: formattedLocation,
                        value: value.coord.lat + "," + value.coord.lon
                    }];
                }
            }));
        });
    },
    select: function (event, ui) {
        searchForEvents(event, ui.item.value)
    },
    minLength: 3,
    delay: 300
});

// Search for events using the ticketmasterAPI,
// User city input from browser is converted to latlong location data for better UX
async function searchForEvents(event, search) {
    if (event) {
        event.preventDefault();
    }

    // Get input value and reset to clear form
    var latLong = search;
    searchInput.value = "";
    if (latLong === "") {
        return;
    }


    try {
        clearEventList();
        var ticketmasterData = await getEventData(latLong);
        startClustering(ticketmasterData._embedded.events);
        ticketmasterData._embedded.events.forEach(data => {
            displayVenues(data);
        });
    }
    catch (err) {
        console.log(err);

    }

}

function startClustering(events) {
    // First we need to create an array of DataPoint objects,
    // for the ClusterProvider
    var dataPoints = events.map(function (event) {
        return new H.clustering.DataPoint(event._embedded.venues[0].location.latitude, event._embedded.venues[0].location.longitude);
    });

    // Create a clustering provider with custom options for clustering the input
    var clusteredDataProvider = new H.clustering.Provider(dataPoints, {
        clusteringOptions: {
            // Maximum radius of the neighborhood
            eps: 32,
            // minimum weight of points required to form a cluster
            minWeight: 1
        }
    });

    // Create a layer tha will consume objects from our clustering provider
    var clusteringLayer = new H.map.layer.ObjectLayer(clusteredDataProvider);

    // To make objects from clustering provider visible,
    // we need to add our layer to the map
    map.addLayer(clusteringLayer);
}

if (localStorage.length > 0) {
    for (const item in localStorage) {
        var data = JSON.parse(localStorage.getItem(item));
        if (data) {
            displayVenues(data);
        }
    }
}