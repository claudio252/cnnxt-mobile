angular.module('cnnxtMobile.controllers', [])

.controller('HomeCtrl', function ($scope, $q, Departments) {
	$scope.users = [];
  $scope.destination = '';
  $scope.origin = '';
  $scope.destinationMessage = 'Where do you want to go?';
  $scope.originMessage = 'Where are you starting?';

  $scope.$on('update:destination', function (val) {
    $scope.destination = val;
  });

  $scope.$on('update:origin', function (val) {
    $scope.origin = val;
  });

	$scope.getDepartmentByString = function (str) {
    var deferred = $q.defer();
    var promise = Departments.all();
    var names = [];

    promise.then(function (departments) {
      names = _(departments).filter(function (user) {
        return user.name.toLowerCase().indexOf(str.toLowerCase()) !== -1;
      }).value();

      deferred.resolve(names);
    });

    return deferred.promise;
	};
})

.controller('DepartmentsCtrl', function ($scope, Departments, Categories) {
  $scope.departments = [];
  $scope.colors = ['positive', 'calm', 'balanced', 'energized', 'assertive', 'assertive', 'assertive'];

  $scope.initialize = function () {
    Categories.get();

    var promise = Departments.all();

    promise.then(function (data) {
      // _(data).forEach(function (department) {
      //   department.color = $scope.getRandomColor();
      // });

      for (var i = 0; i < data.length; i++) {
        data[i].color = $scope.getRandomColor();
      }

      $scope.departments = data;
    });
  };

  $scope.getRandomColor = function () {
    return $scope.colors[Math.floor((Math.random() * ($scope.colors.length - 1)) + 1)];
  };

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

  $scope.initialize();
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
  };

  $scope.onLoadCompleted = function () {
    console.log('map loaded');
  };

  $scope.initVgMapviewer($('#container'), '0', 'https://mapmanager.visioglobe.com/public/f530d895e16c967c/content/map.svg');
});

