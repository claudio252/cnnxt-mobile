angular.module('starter.controllers', [])

.controller('DashCtrl', function($scope, $q) {
	$scope.users = [];

	$scope.getUsersByName = function (str) {
		var deferred = $q.defer();

		users = [{
			name: 'Test1'
		}, {
			name: 'Test2'
		}, {
			name: 'Test3'
		}, {
			name: 'Prueba1'
		}, {
			name: 'Prueba2'
		}];

		var names = _(users).filter(function (user) {
			return user.name.toLowerCase().indexOf(str.toLowerCase()) !== -1;
		}).value();//.pluck('name').value();

		deferred.resolve(names);

    return deferred.promise;
	};
})

.controller('ChatsCtrl', function($scope, Chats, Departaments, CORE_API_ENDPOINT) {
  $scope.chats = Chats.all();
  Departaments.get().getList().then(function (response) {
  	console.log(response);
  });
})

.controller('ChatDetailCtrl', function($scope, $stateParams, Chats) {

  $scope.chat = Chats.get($stateParams.chatId);

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

.controller('AccountCtrl', function($scope) {
  $scope.settings = {
    enableFriends: true
  };
});
