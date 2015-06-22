'use strict';

angular.module('cnnxtMobile').controller('DirectionCtrl', function ($scope, $stateParams, Departments) {

	$scope.$on('vg:initialized', function () {

		var locationPromise = Departments.getByDepartmentId($stateParams.location);
    locationPromise.then(function (response) {
      $scope.destination = response;
    });
	});
});