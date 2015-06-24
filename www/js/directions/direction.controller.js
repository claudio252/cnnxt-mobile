'use strict';

angular.module('cnnxtMobile').controller('DirectionCtrl', function ($scope, $state, $stateParams, Departments) {

	$scope.$on('vg:initialized', function () {

		var locationPromise = Departments.getByDepartmentId($stateParams.location);
    locationPromise.then(function (response) {
      $scope.destination = response[0];
    });
	});

	$scope.goToMain = function () {
		$state.go('dashboard.home');
	};
});