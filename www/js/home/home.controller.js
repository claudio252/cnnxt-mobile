'use strict';

angular.module('cnnxtMobile').controller('HomeCtrl', function ($scope, $rootScope, $q, $state, Departments, Categories) {
	$scope.categories = [];
  $scope.categoriesFiltered = [];
  $scope.destination = null;
  $scope.origin = null;
  $scope.destinationMessage = 'Where do you want to go?';
  $scope.originMessage = 'Where are you starting from?';

  $scope.model = {
  	originName: '',
  	destinationName: ''
  };

  $scope.initialize = function () {
  	// console.log('IOS?: ' + ionic.Platform.isIOS());
   //  console.log('Android?: ' + ionic.Platform.isAndroid());

    var promise = Categories.allFake();

    promise.then(function (categories) {
      categories = _.forEach(categories, function (category) {
        category.deparments = [];
      });

      $scope.categories = categories;
    });

    $rootScope.$on('clear:view', function (event, params) {
      $scope.categoriesFiltered = [];

      $scope.destination = null;
      $scope.origin = null;
      $scope.destinationMessage = 'Where do you want to go?';
      $scope.originMessage = 'Where are you starting from?';

      if (params.destination) {

        Departments.getByDepartmentId(params.destination).then(function (response) {
          $scope.setValue('destination', response[0]);
        });
      }
    });
  }

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
      $scope.destination = department;
      $scope.model.destinationName = '';
    } else {
      $scope.originMessage = 'Start:';
      $scope.origin = department;
      $scope.model.originName = '';
    }

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

  $scope.getResults = function (search) {
    var results = _.filter($scope.categories, function (category) {
      return category.name.toLowerCase().indexOf(search.toLowerCase()) !== -1;
    });

    return results;
  };

  $scope.getDirections = function () {
    $state.go('dashboard.directions', { locations: $scope.destination.id + ',' + $scope.origin.id });
  };

  $scope.showDirectory = function () {
    $state.transitionTo('dashboard.departments');
  };

  $scope.$on('$stateChangeSuccess', function (event, toState) {
    if(toState.name === 'dashboard.home')
      $scope.initialize() ;
  });
});