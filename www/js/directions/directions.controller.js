'use strict';

angular.module('cnnxtMobile').controller('TestCtrl', function ($scope, $stateParams, Departments) {

	$scope.$on('vg:initialized', function () {
		// $scope.origin = $stateParams.locations.split(',')[0];
		// $scope.destination = $stateParams.locations.split(',')[1];
		$scope.destination = $stateParams.direction;
	});
});