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

.controller('MapCtrl1', function ($scope, $ionicLoading, $compile) {
  $scope.options = ['download app', 'text only pdf', 'pdf with map'];
  $scope.showOptions = false;

  var mapviewer = null;
  var doNotUseSetPlaceName = false;
  var activeFloorId = "1";
  var changeFloorAnimationDuration = 300; // change floor animation duration in ms.
  var IMAGE_HOST = 'http://norwalk.connexient.com/';
  var kioskMapId = "dept1-15";

  // VG Mapviewer

  $scope.initVgMapviewer = function (container, initialFloorName, path) {
    activeFloorId = initialFloorName;
    mapviewer = new vg.mapviewer.Mapviewer();
    mapviewer.initialize(container[0], {
      path: '//mapmanager.visioglobe.com/public/web2d15037fdebfd/content/map.tiles.json',
      rendererType: 'webgl',
      initialFloorName: initialFloorName
    }).done($scope.onLoadCompleted)
    .fail(function() {
      console.log('load error');
    });

    // $(window).resize(function(event) {
    //     var h = $(window).height();
    //     var w = $(window).width();
    //     w = w - $('#left-column').width();
    //     container.height(h);
    //     container.width(w);
    //     $('#instructions').width(w);
    //   mapviewer.resize(container.width(), container.height());
    // });
  };

  $scope.onLoadCompleted = function () {
    console.log('COMPLETED');
  };

  // $scope.initVgMapviewer($('#container'), '1', 'https://mapmanager.visioglobe.com/public/f530d895e16c967c/content/map.svg');
  $scope.initVgMapviewer($('#container'), '0', 'https://mapmanager.visioglobe.com/public/f530d895e16c967c/content/map.svg');
});

