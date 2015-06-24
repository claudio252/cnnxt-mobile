'use strict';

angular.module('cnnxtMobile').controller('DepartmentCtrl', function ($scope, $state, $stateParams, Departments) {
	$scope.location = {};

	$scope.initialize = function () {
		var departmentId = $stateParams.departmentId;
		var promise = Departments.getByDepartmentId(departmentId);

		promise.then(function (response) {
			$scope.location = response[0];
		});
	};

	$scope.goToMap = function () {
		$state.go('dashboard.direction', { location: $scope.location.id });
	};

	$scope.goToMain = function () {
		$state.go('dashboard.home');
	};

	$scope.$on('$stateChangeSuccess', function (event, toState) {
    if(toState.name === 'dashboard.department')
      $scope.initialize() ;
  });
});