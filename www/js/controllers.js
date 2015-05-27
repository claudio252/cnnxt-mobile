angular.module('cnnxtMobile.controllers', [])

.controller('HomeCtrl', function ($scope, $q, Departments, Categories) {
	$scope.categories = [];
  $scope.categoriesFiltered = [];
  $scope.destination = '';
  $scope.destination1 = '';
  $scope.origin = '';
  $scope.origin1 = '';
  $scope.destinationMessage = 'Where do you want to go?';
  $scope.originMessage = 'Where are you starting?';

  $scope.initialize = function () {
    var promise = Categories.allFake();

    promise.then(function (categories) {
      $scope.categories = categories;
    });
  };

  $scope.findDestination = function (destination) {
    $scope.categoriesFiltered = $scope.getResults(destination);
  };

  $scope.focus = function () {
    if ($scope.destination1 === '') {
      $scope.categoriesFiltered = $scope.categories;
    } else {
      $scope.categoriesFiltered = $scope.getResults($scope.destination1);
    }
  };

  $scope.getResults = function (search) {
    var results = _.filter($scope.categories, function (category) {
      return category.name.toLowerCase().indexOf(search.toLowerCase()) !== -1;
    });

    return results;
  };

  $scope.initialize();
})

.controller('DepartmentsCtrl', function ($scope, Categories) {
  $scope.categories = [];
  $scope.colors = ['positive', 'calm', 'balanced', 'energized', 'assertive', 'assertive', 'assertive'];

  $scope.initialize = function () {

    var promise = Categories.allFake();

    promise.then(function (categories) {
      $scope.categories = categories;
    });
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

