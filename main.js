var app = angular.module("myApp", ["ngRoute"]);
angular.module("myApp")
    .config(function ($routeProvider) {
        $routeProvider
            .when("/", {
                templateUrl: "theatre.html",
                controller: "theatreController"
            })
            .when("/register", {
                templateUrl: "register.html",
            })
            .when("/movies/:theatreId", {
                templateUrl: "movies.html",
                controller: "moviesController"
            })
            .when("/layout", {
                templateUrl: "layoutNew.html",
                controller: "newLayoutController",
                resolve: {
                    "check": function ($location, layoutService) {
                        if (!layoutService.showTime && !layoutService.showDate && !layoutService.theatreMovieId) {
                            $location.path("/");
                        }
                    }
                }
            })
            .when("/login", {
                templateUrl: "login.html",
                controller: "loginController",

            })
            .when("/checkout", {
                templateUrl: "checkout.html",
                resolve: {
                    "check": function ($location, $rootScope) {
                        if (!$rootScope.loggedIn) {
                            $location.path("/guestLogin");
                        }
                    }
                }
            })
            .when("/guestLogin", {
                templateUrl: "guestLogin.html"
            })
            .otherwise({
                templateUrl: "error404.html"
            })
    });

app.service("controllerService", function () {
    this.dateSelect = new Date();
});

app.service("layoutService", function () {
    this.showTime = "";
    this.theatreMovieId = "";
    this.showDate = "";
});





app.controller("loginController", function ($scope, $location, $http, $rootScope) {

    $scope.email = "";
    $scope.password = "";
    $scope.authenticate = function () {


        $http({
            method: 'POST',
            url: "/MovieTicketBooking/login",
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            transformRequest: function (obj) {
                var str = [];
                for (var p in obj)
                    str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
                return str.join("&");
            },
            data: {
                "email": $scope.email,
                password: $scope.password
            }
        }).then(function (response) {
            console.log(response);
            if (response.status == 200) {
                $rootScope.loggedIn = true;
                $rootScope.email = $scope.email;
                $location.path("/");
            } else {
                alert("wrong email or password");
            }
        },function(response){
            alert("Wrong email or password");
        });
    }

});


app.controller("guestLoginController",function($scope,$http,){
    $scope.email = "";
    $scope.checkOut = function(){
        
    }
});





app.controller("moviesController", function ($scope, $http, $routeParams, $location, controllerService, layoutService) {
    console.log($routeParams);
    console.log($routeParams.theatreId);

    $scope.movies = [];
    $scope.genres = ["Action", "Adventure", "Comedy", "Crime", "Drama", "Historical", "Horror", "Mystery", "Romance", "Fiction", "Social", "Thriller"];

    $scope.submitRating = function (movieId) {
        var rating = 0;
        var fieldSet = document.querySelector("#\\3" + movieId);
        console.log(fieldSet);
        var stars = fieldSet.querySelectorAll("input");
        for (var i = 0; i < stars.length; i++) {
            if (stars[i].checked) {
                rating = stars[i].value;
                break;
            }
        }
        if (rating > 0 && rating <= 5) {
            $http.post("/MovieTicketBooking/ratings", {
                    'rating': rating,
                    'movieId': movieId
                })
                .then(function (response) {
                    if (response.status == 200) {
                        $('#modal' + movieId).modal("hide");
                        alert("Successfully rated the movie");

                    } else {
                        alert("problem in rating the movie");
                    }
                });
        } else {
            alert("You didn't give any rating");
        }
    }


    $scope.selectDate = controllerService.dateSelect;

    var reqDate = $scope.selectDate.toISOString().split('T')[0];
    layoutService.showDate = reqDate;
    $http.post("/MovieTicketBooking/getMovieInTheatre", {
            theatreId: $routeParams.theatreId,
            showDate: reqDate
        })
        .then(function (response) {
            console.log(reqDate);
            console.log(response);
            $scope.movies = response.data;
            for (var i = 0; i < $scope.movies.length; i++) {
                $scope.movies[i].showTime.sort();
            }
        });

    $scope.showLayout = function (time, id) {
        console.log(time);
        layoutService.showTime = time;
        layoutService.theatreMovieId = id;
        $location.path('/layout');
    }
});


app.controller("theatreController", function ($scope, $http, controllerService) {



    $scope.dates = [new Date()];
    $scope.months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    for (var i = 0; i < 3; i++) {
        var temp = new Date();
        temp.setDate($scope.dates[$scope.dates.length - 1].getDate() + 1);
        $scope.dates.push(temp);
    }

    $scope.dateSelect = controllerService.dateSelect;
    $scope.dateSelect = $scope.dates[0];

    $scope.setDate = function (date) {
        $scope.dateSelect = date;
        controllerService.dateSelect = date;
        console.log(controllerService.dateSelect);
        console.log(document.cookie);
    };

    $scope.checkActive = function (date) {
        if ($scope.dateSelect.getDate() == date) {
            return "btn-success";
        }
        return;
    };

    $scope.getTheatres = function () {
        $http.get("/MovieTicketBooking/listTheatres")
            .then(function (response) {
                console.log(response);
                $scope.theatres = response.data;
            });
    };

    $scope.lat = null;
    $scope.long = null;

    $scope.getLocation = function () {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(showPosition, showError);
        } else {
            alert("Geolocation is not supported by this browser.")
        }
    }

    function showPosition(position) {
        $scope.lat = position.coords.latitude;
        $scope.long = position.coords.longitude;
    }

    function showError(error) {
        switch (error.code) {
            case error.PERMISSION_DENIED:
                x.innerHTML = "User denied the request for Geolocation."
                break;
            case error.POSITION_UNAVAILABLE:
                x.innerHTML = "Location information is unavailable."
                break;
            case error.TIMEOUT:
                x.innerHTML = "The request to get user location timed out."
                break;
            case error.UNKNOWN_ERROR:
                x.innerHTML = "An unknown error occurred."
                break;
        }
    }


    $scope.theatres = []
    //Function to get distance using latitude and longitude
    $scope.getDistance = function (lat1, lon1, lat2, lon2) {
        var radlat1 = Math.PI * lat1 / 180;
        var radlat2 = Math.PI * lat2 / 180;
        var theta = lon1 - lon2;
        var radtheta = Math.PI * theta / 180;
        var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
        dist = Math.acos(dist);
        dist = dist * 180 / Math.PI;
        dist = dist * 111.18957696;
        return dist
    }

    //Function to sort theatres by distance
    $scope.sortyByDistance = function () {
        ul = document.querySelector("#theatres")
        var new_ul = ul.cloneNode(false);

        // Add all lis to an array
        var lis = [];
        for (var i = ul.childNodes.length; i--;) {
            if (ul.childNodes[i].nodeName === 'LI')
                lis.push(ul.childNodes[i]);
        }

        // Sort the list in ascending order
        lis.sort(function (a, b) {
            console.log(b.getAttribute('data-lat'), b.getAttribute('data-long'), $scope.lat, $scope.long, a.getAttribute('data-lat'), a.getAttribute('data-long'), $scope.lat, $scope.long);
            return $scope.getDistance(a.getAttribute('data-lat'), a.getAttribute('data-long'), $scope.lat, $scope.long) - $scope.getDistance(b.getAttribute('data-lat'), b.getAttribute('data-long'), $scope.lat, $scope.long);
        });

        // Add them into the ul in order
        for (var i = 0; i < lis.length; i++)
            new_ul.appendChild(lis[i]);
        ul.parentNode.replaceChild(new_ul, ul);
    }
});














app.controller("newLayoutController", function ($scope, $location, $http, layoutService) {


    var data = {
        "theatreMovieId": layoutService.theatreMovieId,
        "showDate": layoutService.showDate,
        "showTime": layoutService.showTime
    }

    function bookedTickets() {

        $http.post("/MovieTicketBooking/bookedTickets", data)
            .then(function (response) {
                console.log(response);
                console.log("here");
                for (var i = 0; i < response.data.length; i++) {
                    var row = response.data[i][0].charCodeAt(0) - 65;
                    var col = response.data[i].substring(1);
                    $scope.seats[row][col].booked = true;
                }

            })
    }

    $scope.quantities = [{
        id: 1,
        val: 1
    }, {
        id: 2,
        val: 2
    }, {
        id: 3,
        val: 3
    }, {
        id: 4,
        val: 4
    }];

    $scope.selectedCount = $scope.quantities[0];
    // console.log(layoutService);
    function createSeats(startLetter, rows, cols) {
        var rowArray = [],
            columnArray = [];
        for (var i = 0, k = startLetter; i < rows; i++, k++) {
            for (var j = 1; j <= cols; j++) {
                columnArray.push({
                    val: j,
                    letter: String.fromCharCode(k),
                    check: false,
                    booked: false
                });
            }
            rowArray.push(columnArray);
            columnArray = [];
        }
        return rowArray;
    }

    $scope.seats = createSeats(65, 15, 30);
    bookedTickets();

    $scope.removeAllCheck = function () {
        for (var i = 0; i < $scope.seats.length; i++) {
            for (var j = 0; j < $scope.seats[i].length; j++) {
                $scope.seats[i][j].check = false;
            }
        }
    }

    function totalChecked() {
        var total = 0;
        for (var i = 0; i < $scope.seats.length; i++) {
            for (var j = 0; j < $scope.seats[i].length; j++) {
                if ($scope.seats[i][j].check) {
                    total++;
                }
            }
        }
        return total;
    }


    $scope.select = function (seat) {
        if (totalChecked() < $scope.selectedCount.val && !seat.booked) {
            seat.check = !seat.check;
        } else {
            seat.check = false;
        }
    }


    $scope.checkSeats = function () {

        if (totalChecked() > 0) {
            $http.post("/MovieTicketBooking/bookedTickets", data)
                .then(function (response) {
                    console.log(response);
                    for (var i = 0; i < response.data.length; i++) {
                        var row = response.data[i][0].charCodeAt(0) - 65;
                        var col = response.data[i].substring(1);
                        if ($scope.seats[row][col].check) {
                            alert("Selected Seats are already booked. Please select other seats");
                            bookedTickets();
                            $scope.removeAllCheck();
                            return;
                        }
                    }

                    $location.path("/checkout");
                });
        }
        else
        {
            alert("No seats selected");
        }
    }




});




























// app.factory('seatsManager', SeatsFactory);

// function SeatsFactory($rootScope, $timeout) {
//     drawSeats = function (startLetter, rows, cols) {
//         var rowArray = [],
//             columnArray = [];
//         for (var i = 0, k = startLetter; i < rows; i++, k++) {
//             for (var j = 1; j <= cols; j++) {
//                 columnArray.push({
//                     val: j,
//                     letter: String.fromCharCode(k),
//                     check: false,
//                     booked: false
//                 });
//             }
//             rowArray.push(columnArray);
//             columnArray = [];
//         }
//         return rowArray;
//     }


//     var seats = {
//             'Standard': {
//                 visible: false,
//                 seats: drawSeats(65, 15, 30)
//             }
//         },
//         checkedSeatCount = 0,
//         currentSelectionSession = {},
//         DEFAULT_SELECT_SESSION = {
//             checkedSeats: {},
//             count: 0,
//             total: 0.0
//         };


//     function init() {
//         currentSelectionSession = angular.copy(DEFAULT_SELECT_SESSION);
//     }
//     init();



//     function checkSelected(newCount) {
//         if (checkedSeatCount === 0) {
//             factory.availCount = angular.copy(newCount);
//         } else if (newCount.val > checkedSeatCount) {

//             factory.availCount.val = (newCount.val - checkedSeatCount);
//         } else {
//             removeAllCheck();
//             checkedSeatCount = 0;
//         }
//     }

//     function removeAllCheck() {
//         keys = Object.keys(seats);
//         for (var rang = 0; rang < keys.length; rang++) {
//             var key = keys[rang];
//             var curSeats = seats[key].seats;
//             for (var row = 0; row < curSeats.length; row++) {
//                 for (var col = 0; col < curSeats[row].length; col++) {
//                     if (!curSeats[row][col].booked) {
//                         curSeats[row][col].check = false;
//                         removeSeatFromSession(key, curSeats[row], col);
//                     }
//                 }
//             }
//         }
//         checkedSeatCount = 0;
//     }

//     function storeSeatInSession(rang, row, seatIndex) {
//         if (angular.isUndefined(currentSelectionSession
//                 .checkedSeats[rang])) {
//             currentSelectionSession
//                 .checkedSeats[rang] = [];
//         }

//         var seat = angular.copy(row[seatIndex]);

//         delete seat['$$hashKey'];
//         delete seat['check'];
//         delete seat['booked'];

//         currentSelectionSession.checkedSeats[rang].push(seat);
//         // console.log(currentSelectionSession);
//     }

//     function removeSeatFromSession(rang, row, seatIndex) {
//         if (currentSelectionSession.checkedSeats[rang]) {
//             delete currentSelectionSession.checkedSeats[rang].pop();
//         }
//     }

//     function selectSeats(selection, count) {
//         var row = selection.row,
//             seat = selection.seat,
//             borderDistance,
//             rest,
//             lastIndex,
//             lastIndexBookedCheck;

//         if (!seat.booked && !seat.check) {
//             if (factory.availCount.val == 0) {
//                 factory.availCount = angular.copy(count);
//                 removeAllCheck();
//             }

//             lastIndexBookedCheck = row.indexOf(seat) + factory.availCount.val;

//             if (lastIndexBookedCheck > row.length)
//                 lastIndexBookedCheck = row.length;

//             borderDistance = row.length - row.indexOf(seat);

//             for (var i = row.indexOf(seat); i < lastIndexBookedCheck; i++) {
//                 if (row[i].booked) {
//                     borderDistance = i - row.indexOf(seat);
//                     i = row.length;
//                     lastIndex = row.indexOf(seat) + borderDistance;
//                 }
//             }

//             rest = borderDistance > factory.availCount.val ? 0 :
//                 factory.availCount.val - borderDistance;

//             // console.log('Last Index: ' + lastIndex);
//             // console.log('Rest: ' + rest);
//             // console.log('Border Distance: ' + borderDistance);
//             // console.log('Last Index Booked Check: ' + lastIndexBookedCheck);

//             if (!lastIndex) {
//                 lastIndex = rest > 0 ? row.length :
//                     row.indexOf(seat) + factory.availCount.val;
//             }

//             for (var seatIndex = row.indexOf(seat); seatIndex < lastIndex; seatIndex++) {
//                 row[seatIndex].check = true;
//                 storeSeatInSession(selection.rang, row, seatIndex);
//                 checkedSeatCount++;
//             }
//             factory.availCount.val = rest;

//         }
//     }

//     function bookCheckedSeats() {
//         var keys = Object.keys(seats),
//             bookedSession;
//         console.log("seats");
//         console.log(seats);
//         for (var rang = 0; rang < keys.length; rang++) {
//             var key = keys[rang];
//             var curSeats = seats[key].seats;

//             // console.log('Checked Seats '+ seats[key].seats);

//             for (var row = 0; row < curSeats.length; row++) {
//                 for (var col = 0; col < curSeats[row].length; col++) {
//                     if (curSeats[row][col].check) {
//                         curSeats[row][col].booked = true;
//                         curSeats[row][col].check = false;
//                     }
//                 }
//             }
//         }

//         currentSelectionSession.count = checkedSeatCount;
//         checkedSeatCount = 0;
//         bookedSession = angular.copy(currentSelectionSession);

//         // console.log(bookedSession);

//         currentSelectionSession = angular.copy(DEFAULT_SELECT_SESSION);

//         // console.log(currentSelectionSession);

//         return bookedSession;
//     }

//     var factory = {
//         drawSeats: drawSeats,
//         map: seats,
//         select: selectSeats,
//         availCount: {},
//         setAvailCount: function (count) {
//             checkSelected(count);
//         },
//         getSeats: function (rang) {
//             return seats[rang];
//         },
//         showQuality: function (rang) {
//             angular.forEach(Object.keys(seats), function (curRang) {
//                 seats[rang].visible = (curRang === rang);
//             });
//             this.availCount.val = this.availCount.id;
//             removeAllCheck();
//         },
//         bookCheckedSeats: bookCheckedSeats
//     };
//     return factory
// }



// app.controller('layoutController', ['$scope', '$window', 'seatsManager', function ($scope, $window, seatsManager) {
//     var init = function () {
//         $scope.standardSeats = seatsManager.getSeats('Standard');
//         $scope.seats = seatsManager;
//         $scope.quantities = [{
//             id: 0,
//             val: 0
//         }, {
//             id: 1,
//             val: 1
//         }, {
//             id: 2,
//             val: 2
//         }, {
//             id: 3,
//             val: 3
//         }, {
//             id: 4,
//             val: 4
//         }, ];
//         $scope.seatQualities = ['Standard'];
//         $scope.seatQuality = 'Standard';
//         $scope.selectedCount = $scope.quantities[1];
//         seatsManager.setAvailCount($scope.selectedCount);
//     }
//     seatsManager.map.Standard.seats[0][0].booked = true;
//     console.log("scope");
//     console.log($scope.seats);
//     console.log(seatsManager.map.Standard.seats);

//     $scope.storeSeat = function () {
//         if ($scope.seats.availCount.val != 0) {
//             $window.alert("You haven't selected " +
//                 $scope.seats.availCount.val + " seats");
//             return;
//         }
//         var sessionInfo = seatsManager.bookCheckedSeats();
//         seatsManager.setAvailCount($scope.selectedCount);

//         // console.log(sessionInfo.checkedSeats);

//         $scope.alertMsg = [];
//         angular.forEach(sessionInfo.checkedSeats, function (v, k) {
//             for (var i = 0; i < v.length; i++) {
//                 $scope.alertMsg.push(v[i].val + v[i].letter);
//             }
//         });

//         $window.alert('Thank you for Booking ' + sessionInfo.count + ' seats. ' +
//             'Your seats are: ' + $scope.alertMsg.join(', '));
//     };

//     init();
// }]);