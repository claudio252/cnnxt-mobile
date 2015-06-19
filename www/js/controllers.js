angular.module('cnnxtMobile.controllers', [])

.controller('GlobalController', function ($scope, $state) {

  //Set global variables here
  $scope.global = {};

  $scope.goToMain = function (locationId) {
    console.log(locationId);
    $state.go('dashboard.home', { destination: locationId } );
  };
})

.controller('HomeCtrl', function ($scope, $rootScope, $q, $state, Departments, Categories) {

  $scope.global.selectedLocations = [];
	$scope.categories = [];
  $scope.categoriesFiltered = [];
  $scope.destination1 = '';
  $scope.origin1 = '';
  $scope.destinationMessage = 'Where do you want to go?';
  $scope.originMessage = 'Where are you starting from?';

  $scope.model = {
    originName: '',
    destinationName: ''
  };

  $scope.goToTest = function () {
    $state.transitionTo('dashboard.test', { locations: 'D-01-02,D-01-01' });
  };

  $scope.initialize = function () {
    // console.log('IOS?: ' + ionic.Platform.isIOS());
    // console.log('Android?: ' + ionic.Platform.isAndroid());

    var promise = Categories.allFake();

    promise.then(function (categories) {
      categories = _.forEach(categories, function (category) {
        category.deparments = [];
      });

      $scope.categories = categories;
    });

    $rootScope.$on('clear:view', function (event, params) {
      $scope.global.selectedLocations = [];
      $scope.categoriesFiltered = [];

      $scope.destination1 = '';
      $scope.origin1 = '';
      $scope.destinationMessage = 'Where do you want to go?';
      $scope.originMessage = 'Where are you starting from?';

      if (params.destination) {

        Departments.getByDepartmentId(params.destination).then(function (response) {
          console.log(response);
          $scope.setValue('destination', response[0]);
        });
      }
    });
  };

  $scope.findDestination = function (destination) {
    $scope.categoriesFiltered = $scope.getResults(destination);
  };

  $scope.findOrigin = function (origin) {
    $scope.categoriesFiltered = $scope.getResults(origin);
  };

  $scope.setValue = function (context, department) {
    var name = department.name;
    console.log('setting to: ' + context + ' name: ' + name);

    if (context === 'destination') {
      $scope.destinationMessage = 'Destination:';
      $scope.destination1 = name;
      $scope.model.destinationName = '';
    } else {
      $scope.originMessage = 'Start:';
      $scope.origin1 = name;
      $scope.model.originName = '';
    }

    $scope.global.selectedLocations.push(department);
    $scope.categoriesFiltered = [];
  };

  $scope.getDepartments = function (category) {
    Departments.getByCategoryId(category.category_id).then (function (response) {
      category.departments = response;
    });
  };

  $scope.focus = function (context, value) {
    if (value === '') {
      $scope.categoriesFiltered = $scope.categories;
    } else {
      $scope.categoriesFiltered = $scope.getResults(value);
    }
  };

  $scope.blur = function (value) {
    if (value === '') {
      $scope.categoriesFiltered = [];
    }
  };

  $scope.getResults = function (search) {
    var results = _.filter($scope.categories, function (category) {
      return category.name.toLowerCase().indexOf(search.toLowerCase()) !== -1;
    });

    return results;
  };

  $scope.getDirections = function () {
    $state.go('dashboard.directions', { locations: $scope.global.selectedLocations.map(function (d) { return d.id; }).join(',') });
  };

  $scope.initialize();
})

.controller('DepartmentsCtrl', function ($scope, $state, Categories, Departments) {
  $scope.global.selectedLocations = [];

  $scope.categories = [];
  $scope.colors = ['positive', 'calm', 'balanced', 'energized', 'assertive', 'assertive', 'assertive'];

  $scope.$on('$stateChangeSuccess', function (event, toState) {
    if(toState.name === 'dashboard.departments')
      $scope.initialize() ;
  });

  $scope.initialize = function () {
    var promise = Categories.allFake();

    promise.then(function (categories) {
      categories = _.forEach(categories, function (category) {
        category.departments = [];
      });

      $scope.categories = categories;
    });
  };

  $scope.getDepartments = function (category) {
    Departments.getByCategoryId(category.category_id).then (function (response) {
      category.departments = response;
    });
  };

  $scope.toggleCategory = function (category, isClosed) {
    if (isClosed) {
      category.departments = [];
    } else {
      $scope.getDepartments(category);
    }
  };

  $scope.selectDepartment = function (department) {
    $scope.global.selectedLocations.push(department);
    $state.go('dashboard.department', { department: department.id });
  };
})

.controller('DepartmentCtrl', function ($scope, $state, $stateParams, Departments) {
  $scope.location = {};

  $scope.initialize = function () {
    var departmentId = $stateParams.department;
    var promise = Departments.getByDepartmentId(departmentId);

    promise.then(function (response, data) {
      $scope.location = response;
    });
  };

  $scope.goToMap = function () {
    $state.go('dashboard.direction', { location: $scope.location.id })
  };

  $scope.$on('$stateChangeSuccess', function (event, toState) {
    if(toState.name === 'dashboard.department')
      $scope.initialize() ;
  });
})

.controller('DirectionsCtrl', function ($scope, $ionicLoading, $compile, $state) {
  $scope.options = ['download app', 'text only pdf', 'pdf with map'];
  $scope.showOptions = false;

  //Map variables
  $scope.currentNavigation = null;

  //Map attributes
  $scope.mapviewer = null;
  $scope.activeFloorId = "0";

  $scope.$on('$stateChangeSuccess', function (event, toState) {
    if(toState.name === 'dashboard.directions')
      $scope.initialize();
  });

  $scope.initialize = function () {
    if ($scope.global.selectedLocations === undefined) {
      $state.go('dashboard.home');
      return;
    } else {
      $scope.destination = $scope.global.selectedLocations[0];
      $scope.origin = $scope.global.selectedLocations[1];

      // GlobeDemo Map
      // $scope.initVgMapviewer($('#directions-container'), $scope.origin.floor_type_id, '//mapmanager.visioglobe.com/public/def4fd50656f4028/content/map.svg');
    $scope.initVgMapviewer($('#directions-container'), $scope.origin.floor_type_id, 'data.bundles/map.tiles.json');
    }
  };

  // VG Mapviewer
  $scope.initVgMapviewer = function (container, initialFloorName, path) {
    activeFloorId = initialFloorName;
    if ($scope.mapviewer !== null) {
      $scope.onLoadCompleted();
      return;
    }
    $scope.mapviewer = new vg.mapviewer.web.Mapviewer();
    $scope.mapviewer.initialize(container[0], {
      path: path,
      initialFloorName: initialFloorName,
      rendererType: 'webgl'
    }).done($scope.onLoadCompleted)
    .fail(function() {
      console.log('Something went wrong while initializing map.');
    });
  };

  $scope.onLoadCompleted = function () {
    var originPlace;
    var destinationPlace;

    $scope.mapviewer.start();

    var places = $scope.mapviewer.getAllPlaces();

    originPlace = $scope.mapviewer.getPlace($scope.origin.hotspot_map);
    destinationPlace = $scope.mapviewer.getPlace($scope.destination.hotspot_map);
    $scope.calculateRoute(originPlace, destinationPlace);
    $scope.mapviewer.camera.goTo(originPlace);
    // $scope.setInitialPositions(originPlace);

  };

  $scope.setActiveLocations = function (place) {
    $scope.mapviewer.highlight(place, 0x00FF00, { opacity: 0.5 });
  };

  $scope.setInitialPositions = function (place) {
    $scope.setPosition(place.vg.position);
  };

  //Receives an object with x, y
  $scope.setPosition = function (position) {
    var pos = $scope.mapviewer.camera.position;

    pos.radius = 30;

    pos.x = position.x;
    pos.y = position.y;

    $scope.mapviewer.camera.position = pos;
    $scope.mapviewer.camera.pitchManipulatorEnabled = true;
    console.log($scope.mapviewer.camera);
  };

  $scope.calculateRoute = function (origin, destination) {
    var lRouteRequest = {};
    var currentRoute = null;

    lRouteRequest.src = origin.vg.id;
    lRouteRequest.dst = destination.vg.id;

    lRouteRequest.computeNavigation = true;

    //Override certain navigation parameters
    lRouteRequest.navigationParameters = lRouteRequest.navigationParameters || {};
    lRouteRequest.navigationParameters.modalityParameters = lRouteRequest.navigationParameters.mModalityParameters || {};

    lRouteRequest.navigationParameters.modalityParameters.shuttle = lRouteRequest.navigationParameters.modalityParameters.shuttle || {};
    lRouteRequest.navigationParameters.modalityParameters.shuttle.straightAngleThreshold = lRouteRequest.navigationParameters.modalityParameters.shuttle.straightAngleThreshold || 180.0;
    lRouteRequest.navigationParameters.modalityParameters.shuttle.distanceFromCouloirThreshold = lRouteRequest.navigationParameters.modalityParameters.shuttle.distanceFromCouloirThreshold || 1000.0;

    // Changed default straightAngleThreshold
    var modalities = $scope.mapviewer.getRoutingModalities();
    var modalityParameters = lRouteRequest.navigationParameters.modalityParameters;
    for (var i in modalities)
    {
      var modality = modalities[i];
      modalityParameters[modality] = modalityParameters[modality] || {};
      modalityParameters[modality].straightAngleThreshold = modalityParameters[modality].straightAngleThreshold || 30.0;
    }

    $scope.mapviewer.computeRoute(lRouteRequest).fail(function(pRouteRequest) {
      alert("Sorry, there are problems with Routing Server");
    }).done(function(pRouteRequest, pRouteData) {
      if (currentRoute != null) {
        currentRoute.remove();
      }
      if ($scope.currentNavigation != null) {
        $scope.currentNavigation.remove();
      }
      if (pRouteData.status && pRouteData.status != 200) {
        alert("Sorry, no route available between " + pRouteRequest.src + " and " + pRouteRequest.dst + ".");
        return;
      }

      currentRoute = new MyRoute($scope.mapviewer, pRouteData);
      if (currentRoute.isValid()) {
        currentRoute.show();

        var startRouteAtFirstShop = true;

        if (startRouteAtFirstShop) {
          $scope.setInitialPositions(origin);
        }
        else {
          $scope.setInitialPositions(originPlace);
          var viewpoint = currentRoute.getInitialViewpointPosition();
          var floorname = currentRoute.getInitialFloor();
        }

        $scope.currentNavigation = new MyNavigation($scope.mapviewer, pRouteData);
      }
      else {
        alert("Problems rendering the route between "+pRouteRequest.src + " and " + pRouteRequest.dst + ".");
      }
    });

    $scope.nextInstructions = function () {
      $scope.currentNavigation.displayNextInstruction();
    };

    $scope.previousInstructions = function () {
      $scope.currentNavigation.displayPrevInstruction();
    };
  };
})

.controller('DirectionCtrl', function ($scope, $state) {
  $scope.department = null;
  $scope.mapviewer1 = null;

  $scope.$on('$stateChangeSuccess', function (event, toState) {
    if(toState.name === 'dashboard.direction') {
      $scope.initialize() ;
    }
  });

  $scope.initialize = function () {
    if ($scope.global.selectedLocations === undefined) {
      $state.go('dashboard.home');
      return;
    } else {
      $scope.department = $scope.global.selectedLocations[0];
      // $scope.initVgMapviewer($('#directions-container'), $scope.department.floor_type_id, '//mapmanager.visioglobe.com/public/def4fd50656f4028/content/map.svg');
      $scope.initVgMapviewer($('#direction-container'), $scope.department.floor_type_id, 'data.bundles/map.tiles.json');
    }
  };

  $scope.initVgMapviewer = function (container, initialFloorName, path) {
    activeFloorId = initialFloorName;
    if ($scope.mapviewer1 !== null) {
      $scope.mapviewer1 = null;
    }

    console.log(JSON.stringify(container));
    $scope.mapviewer1 = new vg.mapviewer.web.Mapviewer();

    $scope.mapviewer1.initialize(container[0], {
      path: path,
      initialFloorName: initialFloorName
    }).done($scope.onLoadCompleted)
    .fail(function() {
      console.log('load error');
    });
  };

  $scope.onLoadCompleted = function () {
    var departmentPlace;

    departmentPlace = $scope.mapviewer1.getPlace($scope.department.hotspot_map);

    $scope.setInitialPositions(departmentPlace);
  };

  $scope.setInitialPositions = function (place) {
    $scope.setPosition(place.vg.position);
  };

  //Receives an object with x, y
  $scope.setPosition = function (position) {

    var pos = $scope.mapviewer1.camera.position;

    pos.radius = 30;

    pos.x = position.x;
    pos.y = position.y;

    $scope.mapviewer1.camera.position = pos;
  };
});

