const usStates = [
  "Alabama",
  "Alaska",
  "Arizona",
  "Arkansas",
  "California",
  "Colorado",
  "Connecticut",
  "Delaware",
  "Florida",
  "Georgia",
  "Hawaii",
  "Idaho",
  "Illinois",
  "Indiana",
  "Iowa",
  "Kansas",
  "Kentucky",
  "Louisiana",
  "Maine",
  "Maryland",
  "Massachusetts",
  "Michigan",
  "Minnesota",
  "Mississippi",
  "Missouri",
  "Montana",
  "Nebraska",
  "Nevada",
  "New Hampshire",
  "New Jersey",
  "New Mexico",
  "New York",
  "North Carolina",
  "North Dakota",
  "Ohio",
  "Oklahoma",
  "Oregon",
  "Pennsylvania",
  "Rhode Island",
  "South Carolina",
  "South Dakota",
  "Tennessee",
  "Texas",
  "Utah",
  "Vermont",
  "Virginia",
  "Washington",
  "West Virginia",
  "Wisconsin",
  "Wyoming"
];

$(createDropdownStates);
$(grabStateSelect);
$(grabCitySelect);

function createDropdownStates() {
  for (i = 0; i < usStates.length; i++) {
    $("#stateSelect").append(`
    <option value=${usStates[i]}>${usStates[i]}</option>
    `);
  }
}

function grabStateSelect() {
  $("#stateSelect").change(function() {
    let selectedState = document.getElementById("stateSelect").value;
    console.log(selectedState);
    createDropDownCities(selectedState);
  });
}

function createDropDownCities(selectedState) {
  let settings = {
    async: true,
    crossDomain: true,
    url: `https://andruxnet-world-cities-v1.p.rapidapi.com/?query=${selectedState}&searchby=state`,
    method: "GET",
    headers: {
      "x-rapidapi-host": "andruxnet-world-cities-v1.p.rapidapi.com",
      "x-rapidapi-key": "3b5c56ed4fmsh1f85dbb3412194fp192c9bjsn83b9f4855daf"
    }
  };

  $.ajax(settings).done(function(response) {
    //console.log(response);
    //console.log(response[0].city)
    //console.log(response.length)
    $("#citySelect").empty();
    for (i = 0; i < response.length; i++) {
      $("#citySelect").append(
        `<option value="${response[i].city}">${response[i].city}</option>`
      );
    }
  });
}

function grabCitySelect() {
  //console.log('cityListenerActive')
  $("form").on("submit", event => {
    event.preventDefault();
    $("#nearbyHikes").empty();
    $("#cityTemp").empty();
    $("#Loading").removeClass("Hidden");
    let selectedCity = document.getElementById("citySelect").value;
    let distanceNearby = document.getElementById("distanceNearby").value;
    console.log(selectedCity);
    getWeather(selectedCity, distanceNearby);
  });
}

function getWeather(selectedCity, distanceNearby) {
  //need to add how to handle if the city isn't available
  fetch(
    `https://api.openweathermap.org/data/2.5/weather?q=${selectedCity}&appid=2142a741df4d2bc633182e1f4be0e379`
  )
    .then(response => {
      if (response.ok) {
        return response.json();
      }
      throw new Error(response.statusText);
    })
    .then(responseJson =>
      displayWeather(responseJson, selectedCity, distanceNearby)
    );
}

function displayWeather(responseJson, selectedCity, distanceNearby) {
  //console.log(responseJson);
  console.log(responseJson.coord);
  //console.log(responseJson.main.temp);
  temp = responseJson.main.temp;
  fTemp = temperatureConversionKtoF(temp);
  //console.log(fTemp);
  $("#cityTemp").html(
    `<p>In ${selectedCity}, the temperature is ${fTemp}&#8457; with ${responseJson.weather[0].description}</p>`
  );
  lon = responseJson.coord.lon;
  lat = responseJson.coord.lat;
  getHikingNearby(lon, lat, distanceNearby);
  getRestaurantsNearby(lat, lon);
}

function temperatureConversionKtoF(temp) {
  fTemperature = Math.round(((temp - 273.15) * 9) / 5 + 32);
  //console.log(fTemperature);
  return fTemperature;
}

function getHikingNearby(lon, lat, distanceNearby) {
  fetch(
    `https://www.hikingproject.com/data/get-trails?lat=${lat}&lon=${lon}&maxDistance=${distanceNearby}&key=200615156-7059bdcd2b6b98be8f43203a26cfe9c0`
  )
    .then(response => {
      if (response.ok) {
        return response.json();
      }
      throw new Error(response.statusText);
    })
    .then(responseHike => displayHike(responseHike));
}

function displayHike(responseHike) {
  console.log(responseHike);
  if (responseHike.trails == 0) {
    $("#nearbyHikes").append(`
    <p>Sorry, no hikes were found nearby</p>`);
  }
  $("#Loading").addClass("Hidden");
  for (i = 0; i < responseHike.trails.length; i++) {
    //add if statement for imgSmall verification, if returns empty
    if (responseHike.trails[i].imgSmall == "") {
      hikeImage = "No image available";
    } else hikeImage = responseHike.trails[i].imgSmall;
    console.log(responseHike.trails[i].imgSmall);
    $("#nearbyHikes").append(`
    <div class="hikenumber${i}">
    <p>The ${responseHike.trails[i].name}: ${responseHike.trails[i].length} miles with a ${responseHike.trails[i].ascent}ft ascent</p>
    <p>${responseHike.trails[i].summary}</p>
    <p><a href="${responseHike.trails[i].url}">${responseHike.trails[i].url}</a></p>
    <p><img src="${hikeImage}" alt= "No image available"/>
    </div>`);
  }
}

function getRestaurantsNearby(lat, lon) {
  $("#panel").removeClass("Hidden");
  $("#map").removeClass("Hidden");
  console.log(lat);
  console.log(lon);
  let pos = {
    lat: lat,
    lng: lon
  };
  console.log(pos);
  bounds = new google.maps.LatLngBounds();
  infoWindow = new google.maps.InfoWindow();
  currentInfoWindow = infoWindow;
  /* TODO: Step 4A3: Add a generic sidebar */
  infoPane = document.getElementById("panel");

  map = new google.maps.Map(document.getElementById("map"), {
    center: pos,
    zoom: 15
  });
  bounds.extend(pos);

  infoWindow.setPosition(pos);
  infoWindow.setContent("Location found.");
  infoWindow.open(map);
  map.setCenter(pos);

  // Call Places Nearby Search on user's location:Set to default or user location
  getNearbyPlaces(pos);
}

// Google Maps/Places integration code
let pos;
let map;
let bounds;
let infoWindow;
let currentInfoWindow;
let service;
let infoPane;

function initMap() {
  // Initialize variables
  bounds = new google.maps.LatLngBounds();
  infoWindow = new google.maps.InfoWindow();
  currentInfoWindow = infoWindow;
  //Generic sidebar
  infoPane = document.getElementById("panel");
  // Try HTML5 geolocation
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      position => {
        pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        map = new google.maps.Map(document.getElementById("map"), {
          center: pos,
          zoom: 15
        });
        bounds.extend(pos);

        infoWindow.setPosition(pos);
        infoWindow.setContent("Location found.");
        infoWindow.open(map);
        map.setCenter(pos);

        // Call Places Nearby Search on user's location
        getNearbyPlaces(pos);
      },
      () => {
        // Browser supports geolocation, but user has denied permission
        handleLocationError(true, infoWindow);
      }
    );
  } else {
    // Browser doesn't support geolocation
    handleLocationError(false, infoWindow);
  }
}

// Handle a geolocation error
function handleLocationError(browserHasGeolocation, infoWindow) {
  // Set default location to Davis, California
  pos = { lat: 38.5449, lng: -121.7405 };
  map = new google.maps.Map(document.getElementById("map"), {
    center: pos,
    zoom: 15
  });

  // Display an InfoWindow at the map center
  infoWindow.setPosition(pos);
  infoWindow.setContent(
    browserHasGeolocation
      ? "Geolocation permissions denied. Using default location."
      : "Error: Your browser doesn't support geolocation."
  );
  infoWindow.open(map);
  currentInfoWindow = infoWindow;

  // Call Places Nearby Search on the default location
  getNearbyPlaces(pos);
}
// Perform a Places Nearby Search Request to find restaurants nearby by keyword
function getNearbyPlaces(position) {
  let request = {
    location: position,
    rankBy: google.maps.places.RankBy.DISTANCE,
    keyword: "restaurant",
    type: "food"
  };

  service = new google.maps.places.PlacesService(map);
  service.nearbySearch(request, nearbyCallback);
}

// Handle the results (up to 20) of the Nearby Search
function nearbyCallback(results, status) {
  if (status == google.maps.places.PlacesServiceStatus.OK) {
    createMarkers(results);
  }
}

// Set markers at the location of each place result
function createMarkers(places) {
  places.forEach(place => {
    let marker = new google.maps.Marker({
      position: place.geometry.location,
      map: map,
      title: place.name
    });

    // Add click listener to each marker
    google.maps.event.addListener(marker, "click", () => {
      let request = {
        placeId: place.place_id,
        fields: [
          "name",
          "formatted_address",
          "geometry",
          "rating",
          "website",
          "photos"
        ]
      };

      /* Only fetch the details of a place when the user clicks on a marker.
       * If we fetch the details for all place results as soon as we get
       * the search response, we will hit API rate limits. */
      service.getDetails(request, (placeResult, status) => {
        showDetails(placeResult, marker, status);
      });
    });

    // Adjust the map bounds to include the location of this marker
    bounds.extend(place.geometry.location);
  });
  /* Once all the markers have been placed, adjust the bounds of the map to
   * show all the markers within the visible area. */
  map.fitBounds(bounds);
}

// Builds an InfoWindow to display details above the marker
function showDetails(placeResult, marker, status) {
  if (status == google.maps.places.PlacesServiceStatus.OK) {
    let placeInfowindow = new google.maps.InfoWindow();
    placeInfowindow.setContent(
      "<div><strong>" +
        placeResult.name +
        "</strong><br>" +
        "Rating: " +
        placeResult.rating.toFixed(1) +
        "</div>"
    );
    placeInfowindow.open(marker.map, marker);
    currentInfoWindow.close();
    currentInfoWindow = placeInfowindow;
    showPanel(placeResult);
  } else {
    console.log("showDetails failed: " + status);
  }
}

/* TODO: Step 4D: Load place details in a sidebar */
// Displays place details in a sidebar
function showPanel(placeResult) {
  // If infoPane is already open, close it
  if (infoPane.classList.contains("open")) {
    infoPane.classList.remove("open");
  }

  // Clear the previous details
  while (infoPane.lastChild) {
    infoPane.removeChild(infoPane.lastChild);
  }

  /* TODO: Step 4E: Display a Place Photo with the Place Details */
  // Add the primary photo, if there is one
  if (placeResult.photos != null) {
    let firstPhoto = placeResult.photos[0];
    let photo = document.createElement("img");
    photo.classList.add("hero");
    photo.src = firstPhoto.getUrl();
    infoPane.appendChild(photo);
  }
  // Add place details with text formatting
  let name = document.createElement("h1");
  name.classList.add("place");
  name.textContent = placeResult.name;
  infoPane.appendChild(name);
  if (placeResult.rating != null) {
    let rating = document.createElement("p");
    rating.classList.add("details");
    rating.textContent = `Rating: ${placeResult.rating.toFixed(1)} \u272e`;
    infoPane.appendChild(rating);
  }
  let address = document.createElement("p");
  address.classList.add("details");
  address.textContent = placeResult.formatted_address;
  infoPane.appendChild(address);
  if (placeResult.website) {
    let websitePara = document.createElement("p");
    let websiteLink = document.createElement("a");
    let websiteUrl = document.createTextNode(placeResult.website);
    websiteLink.appendChild(websiteUrl);
    websiteLink.title = placeResult.website;
    websiteLink.href = placeResult.website;
    websitePara.appendChild(websiteLink);
    infoPane.appendChild(websitePara);
  }

  // Open the infoPane
  infoPane.classList.add("open");
}
