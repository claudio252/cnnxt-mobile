'use strict';

angular.module('cnnxtMobile').controller('DirectionsCtrl', function ($scope, $state, $stateParams, $q, $ionicPopover, Departments) {

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
      $scope.destination = responses[0].value[0];
    	$scope.origin = responses[1].value[0];
    });
	});

  $scope.goToMain = function () {
    $state.go('dashboard.home');
  };
});