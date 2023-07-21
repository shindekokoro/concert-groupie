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