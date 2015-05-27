angular.module('cnnxtMobile.services', [])

.factory('Departments', function($q) {

  return {
    all: function() {
      // return chats;
      var deferred = $q.defer();

      deps = new Array();
      var mapIds = new Object();

      $.getJSON("json/categories.json", function(data) {
        $.each(data, function(i, row) {
          deps[i] = { category_id: row.id, name: row.name };
          mapIds[deps[i].map_id] = deps[i].name;
        });
        deferred.resolve(deps);
      });

      return deferred.promise;
    },
    get: function(chatId) {
      for (var i = 0; i < chats.length; i++) {
        if (chats[i].id === parseInt(chatId)) {
          return chats[i];
        }
      }
      return null;
    }
  };
})

.factory('Categories', function (Restangular) {

  return {
    get: function () {

      var queryObj = {
        action: 'get_hotspot_categories_smh',
        device: 'iphone'
      };

      return Restangular.oneUrl('api').getList('', queryObj);
    }
  };
});
