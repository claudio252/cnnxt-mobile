angular.module('cnnxtMobile.controllers', [])

.controller('HomeCtrl', function ($scope, $q, Departments) {
	$scope.users = [];
  $scope.destination = '';
  $scope.origin = '';

  $scope.$on('update:destination', function (val) {
    $scope.destination = val;
  });

  $scope.$on('update:origin', function (val) {
    $scope.origin = val;
  });

	$scope.getDepartmentByString = function (str) {
		var deferred = $q.defer();

		users = Departments.all();

		var names = _(users).filter(function (user) {
			return user.name.toLowerCase().indexOf(str.toLowerCase()) !== -1;
		}).value();

		deferred.resolve(names);

    return deferred.promise;
	};
})

.controller('DepartmentsCtrl', function ($scope, Departments) {
  $scope.departments = Departments.all();

  $scope.colors = ['positive', 'calm', 'balanced', 'energized', 'assertive', 'assertive', 'assertive']

  $scope.toggleGroup = function(group) {
    if ($scope.isGroupShown(group)) {
      $scope.shownGroup = null;
    } else {
      $scope.shownGroup = group;
    }
  };

  $scope.isGroupShown = function(group) {
    return $scope.shownGroup === group;
  };
})

.controller('MapCtrl', function ($scope, $ionicLoading, $compile) {

  $scope.options = ['download app', 'text only pdf', 'pdf with map'];
  $scope.showOptions = false;

  $scope.initialize = function () {
    var myLatlng = new google.maps.LatLng(43.07493,-89.381388);

    var mapOptions = {
      center: myLatlng,
      zoom: 16,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    var map = new google.maps.Map(document.getElementById("map"),
        mapOptions);

    //Marker + infowindow + angularjs compiled ng-click
    var contentString = "<div><a ng-click='clickTest()'>Click me!</a></div>";
    var compiled = $compile(contentString)($scope);

    var infowindow = new google.maps.InfoWindow({
      content: compiled[0]
    });

    var marker = new google.maps.Marker({
      position: myLatlng,
      map: map,
      title: 'Uluru (Ayers Rock)'
    });

    google.maps.event.addListener(marker, 'click', function() {
      infowindow.open(map,marker);
    });

    $scope.map = map;
  };

  $scope.action = function (action) {
    alert(action);
  };

  $scope.initialize();

   // google.maps.event.addDomListener(window, 'load', $scope.initialize);
})

