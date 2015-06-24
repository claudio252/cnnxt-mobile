'use strict';

angular.module('cnnxtMobile').controller('DepartmentsCtrl', function ($scope, $state, Categories, Departments) {
	$scope.categories = [];
  $scope.colors = ['positive', 'calm', 'balanced', 'energized', 'assertive', 'assertive', 'assertive'];

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
    $state.go('dashboard.department', { departmentId: department.id });
  };

  $scope.goToMain = function () {
		$state.transitionTo('dashboard.home');
  };

  $scope.initialize();
});