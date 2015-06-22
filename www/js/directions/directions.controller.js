'use strict';

angular.module('cnnxtMobile').controller('DirectionsCtrl', function ($scope, $stateParams, $q, $ionicPopover, Departments) {
  $ionicPopover.fromTemplateUrl('templates/popovers/directions.html', {
    scope: $scope,
  }).then(function(popover) {
    $scope.popover = popover;
  });

	$scope.$on('vg:initialized', function () {
		$scope.locations = $stateParams.locations.split(',');

		var locationsPromises = $scope.locations.map(function (locationId) {
      return Departments.getByDepartmentId(locationId);
    });

    $q.allSettled(locationsPromises).then(function (responses) {
    	$scope.origin = responses[0].value;
    	$scope.destination = responses[1].value;
    });
	});
});