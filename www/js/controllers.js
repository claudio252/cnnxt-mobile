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
    $state.transitionTo('dashboard.test', { locations: '0,1' });
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
});



