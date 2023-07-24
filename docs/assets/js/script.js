var searchInput = document.querySelector("#cityList");

// Get ticketmaster api data and store to localstorage for future use.
async function getEventData(location) {
    if (localStorage.getItem(location)) {
        return await JSON.parse(localStorage.getItem(location))
    } else {
        var response = await fetch("https://app.ticketmaster.com/discovery/v2/events.json?classificationName=music&latlong=" + location + "&apikey=" + ticketmasterAPI);
        var data = await response.json();
        localStorage.setItem(location, JSON.stringify(data));
        return data;
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


async function searchForEvents(event, search) {
    if (event) {
        event.preventDefault();
    }

    // Get input value and reset to clear form
    var latlon = search;
    searchInput.value = "";
    if (latlon === "") {
        return;
    }

    // Check to see if location ticketmaster data exists before pulling api again.
    var ticketmasterData = await getEventData(latlon);

    // User probably entered nothing("")
    if (!ticketmasterData) {
        console.log("No ticketmasterAPI Data?");
        return;
    }

    var eventList = document.getElementById("eventList");

    // Iterate and render each day for weather data
    ticketmasterData._embedded.events.forEach(data => {
        // console.log(data);
        var li = document.createElement("li");
        li.textContent = data.name;
        eventList.appendChild(li);
    });

}