angular.module('cnnxtMobile.controllers', [])

.controller('HomeCtrl', function($scope, $q, Departments) {
	$scope.users = [];

	$scope.getDepartmentByString = function (str) {
		var deferred = $q.defer();

		users = Departments.all();

		var names = _(users).filter(function (user) {
			return user.name.toLowerCase().indexOf(str.toLowerCase()) !== -1;
		}).value();

		deferred.resolve(names);

    return deferred.promise;
	};
})

.controller('DepartmentsCtrl', function($scope, Departments) {
  console.log('Departments');
  $scope.departments = Departments.all();

  $scope.toggleGroup = function(group) {
    if ($scope.isGroupShown(group)) {
      $scope.shownGroup = null;
    } else {
      $scope.shownGroup = group;
    }
  };

  $scope.isGroupShown = function(group) {
    return $scope.shownGroup === group;
  };
})

