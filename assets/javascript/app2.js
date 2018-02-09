// Initialize Firebase
var config = {
    apiKey: "AIzaSyBEagO1eUpMcdMCAnHawJnZqjRRF29fgd4",
    authDomain: "project-1-65a27.firebaseapp.com",
    databaseURL: "https://project-1-65a27.firebaseio.com",
    projectId: "project-1-65a27",
    storageBucket: "project-1-65a27.appspot.com",
    messagingSenderId: "185964613097"
};
firebase.initializeApp(config);

var database = firebase.database();
var locationRef = database.ref("/locations");
var topicRef = database.ref("/topics");
var rangeRef = database.ref("/range");
var priceRef = database.ref("/price");
var resultRef = database.ref("/result");

var map;
var infoWindow;
var locationInput;
var topic;
var range;
var price;
var responseResult;


function handleLocationError(browserHasGeolocation, infoWindow, pos) {
    infoWindow.setPosition(pos);
    infoWindow.setContent(browserHasGeolocation ?
        'Error: The Geolocation service failed.' :
        'Error: Your browser doesn\'t support geolocation.');
    infoWindow.open(map);
}


function initMap() {
    // Initialize map to San Francisco
    var sanFrancisco = { lat: 37.773972, lng: -122.431297 };
    map = new google.maps.Map(document.getElementById('map'), {
        center: sanFrancisco,
        zoom: 12,
        mapTypeId: "roadmap"
    });
    infoWindow = new google.maps.InfoWindow;

    // Create the search box and link it to the UI element.
    var input = document.getElementById('pac-input');
    var searchBox = new google.maps.places.SearchBox(input);
    // map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

    // Bias the SearchBox results towards current map's viewport.
    map.addListener('bounds_changed', function() {
        searchBox.setBounds(map.getBounds());
    });

    var markers = [];
    // Listen for the event fired when the user selects a prediction and retrieve
    // more details for that place.
    searchBox.addListener('places_changed', function() {
        var places = searchBox.getPlaces();
        if (places.length == 0) {
            return;
        }
        // Clear out the old markers.
        markers.forEach(function(marker) {
            marker.setMap(null);
        });
        markers = [];
        // For each place, get the icon, name and location.
        var bounds = new google.maps.LatLngBounds();
        places.forEach(function(place) {
            if (!place.geometry) {
                console.log("Returned place contains no geometry");
                return;
            }
            var icon = {
                url: place.icon,
                size: new google.maps.Size(71, 71),
                origin: new google.maps.Point(0, 0),
                anchor: new google.maps.Point(17, 34),
                scaledSize: new google.maps.Size(25, 25)
            };
            // Create a marker for each place.
            var marker = new google.maps.Marker({
                map: map,
                icon: icon,
                title: place.name,
                position: place.geometry.location
            });
            markers.push(marker);

            var infowindow = new google.maps.InfoWindow();
            google.maps.event.addListener(marker, 'click', function() {
                infowindow.setContent(getInfoContent(place));
                console.log(place);
                infowindow.open(map, this);
            });
            if (place.geometry.viewport) {
                // Only geocodes have viewport.
                bounds.union(place.geometry.viewport);
            } else {
                bounds.extend(place.geometry.location);
            }
        });

        map.fitBounds(bounds);
        locationInput = $("#pac-input").val().trim();
        console.log($("#pac-input").val().trim());

        database.ref("/locations").push({
            locationInput: locationInput
        })
    });
}

function getInfoContent(place) {
    var isOpen;
    if (place.opening_hours.open_now) {
        isOpen = "Open";
    } else {
        isOpen = "Closed";
    }
    var openHours = place.opening_hours.weekday_text;
    return '<div><strong>' + place.name + '</strong><br>' +
        place.formatted_address + '<br>' +
        isOpen + '<br>' +
        openHours + '<br>' +
        "Rating: " + place.rating + '<br>'
    '</div>';
}


// //Eventbrite
var counter = 0;
var choiceA = "";
var choiceB = "";
var and = "";
$(".thumbnail").on("click", function compare() {
    console.log("Fuck!")
    console.log(counter)
    event.preventDefault();
    if (counter === 0 && choiceB !== $(this).data("value")) {
        choiceA = $(this).data("value");
        console.log("helo", this)
        counter++
    } else if (counter === 1 && choiceA !== $(this).data("value")) {
        choiceB = $(this).data("value");
        and = "&";
        counter = 0;
    }
    console.log("thisisA", choiceA);
    console.log("thisisB", choiceB);
    topic = choiceA + and + choiceB;
    console.log(topic);
    database.ref("/topics").push({
        topic: topic
    })
});


$(".range").on("click", function() {
    range = $(this).data("value") + "mi";
    console.log(range);

    database.ref("/range").push({
        range: range
    })
})


$(".price").on("click", function() {
    price = $(this).data("value");
    console.log(price);

    database.ref("/price").push({
        price: price
    })
})


$("#filter-search").on("click", function(e) {
    e.preventDefault()
    evenbriteSearch(topic, locationInput, range, price);
})


//Requesting info and adding the value of every button to the url
function evenbriteSearch(topic, locationInput, range, price) {
    var queryURL = "https://www.eventbriteapi.com/v3/events/search/?q=" + topic + "&sort_by=date&location.address=" + locationInput + "&location.within=" + range + "&price=" + price + "&token=KJSHU43DGDL7JI6OFUYJ";
    $.ajax({
            url: queryURL,
            method: "GET"
        })
        .then(function(response) {
            console.log(response);
            responseResult = response;

            database.ref("/result").push({
                result: response
            })

            renderResults();
        });
}


function renderResults() {
    for (var i = 0; i < 5; i++) {
        var eventName = $("<h2>");
        eventName.text(responseResult.events[i].name.text)
        var eventImage = $("<img>");
        eventImage.attr("src", responseResult.events[i].logo.url);
        var eventDescript = $("<p>");
        eventDescript.text("Description: " + responseResult.events[i].description.text)
        eventDescript.hide()
        $("#myModal").append(eventName, eventImage, eventDescript);
        console.log("abc")

    }
}

//Foursquare API and append functions
//Call function gifSearch() to execute, assing searchTerm and location
function gifSearch() {
    var queryURL = "https://api.foursquare.com/v2/venues/search";
    $.ajax({
        url: queryURL,
        data: {
            client_id: "UYCPKGBHUK5DSQSOGFBATS2015CFIZM1CELCN4AIYPT1LEBH",
            client_secret: "EBLDOOVW2FIZBGC0PH3M2NATAUCABKHWRVIC3YFRW1SOTKKF",
            ll: "37.77,-122.42",
            query: "",
            v: "20180206",
            limit: 3
        },
        cache: false,
        type: "GET",
        success: function(response) {
            console.log(response);
            getImages(response);
            appendFourSquare(response);
        },
        error: function(xhr) {
            console.log(xhr);
        }
    });
};


function getImages(responseObj) {
    var photoId = responseObj.response.venues[0].id;
    var queryURL = "https://api.foursquare.com/v2/venues/" + photoId + "/photos";
    $.ajax({
        url: queryURL,
        data: {
            client_id: "UYCPKGBHUK5DSQSOGFBATS2015CFIZM1CELCN4AIYPT1LEBH",
            client_secret: "EBLDOOVW2FIZBGC0PH3M2NATAUCABKHWRVIC3YFRW1SOTKKF",
            v: "20180206",
            limit: 3
        },
        cache: false,
        type: "GET",
        success: function(photoResponse) {
            console.log(photoResponse);
            appendImages(photoResponse);
        },
        error: function(xhr) {
            console.log(xhr);
        }
    });

    function appendImages(arrOfPhotos) {
        console.log(arrOfPhotos)
        for (var i = 0; i < 3; i++) {
            var photoPrefix = arrOfPhotos.response.photos.items[i].prefix;
            var photoSize = "400x300";
            var photoSuffix = arrOfPhotos.response.photos.items[i].suffix;
            var photoURL = photoPrefix + photoSize + photoSuffix;
            var fourSquarePhoto = $("<img>");
            fourSquarePhoto.attr("src", photoURL);
            fourSquarePhoto.attr("");
            $("#imgTarget" + i).append(fourSquarePhoto);
        }
    }
}


function appendFourSquare(responseData) {
    for (var i = 0; i < 3; i++) {
        console.log(responseData.response.venues[i].name);
        $("#fourSquareResults").append("<h2>" + responseData.response.venues[i].name + "</h2>");
        $("#fourSquareResults").append("<p>" + responseData.response.venues[i].location.address + ", " + responseData.response.venues[i].location.city + "</p>");
        $("#fourSquareResults").append("<p>" + "Phone: " + responseData.response.venues[i].contact.formattedPhone + "</p>");
        var imgTarget = $("<p>");
        imgTarget.attr("id", ('imgTarget' + i));
        $("#fourSquareResults").append(imgTarget);
        console.log("abc");

    }
}