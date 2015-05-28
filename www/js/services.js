angular.module('cnnxtMobile.services', [])

.factory('Departments', function($q, Restangular) {

  return {
    getByCategoryId: function(categoryId) {
      //URL is action=get_departments_by_floor_id&floor=1
      var queryObj = {
        action: 'get_departments_by_floor_id',
        floor: categoryId
      };

      return Restangular.oneUrl('api').getList('', queryObj);
      // return Restangular.oneUrl('db').getList('');
    }
  };
})

.factory('Categories', function ($q, Restangular) {

  return {
    all: function () {

      var queryObj = {
        action: 'get_hotspot_categories_smh',
        device: 'iphone'
      };

      return Restangular.oneUrl('api').getList('', queryObj);
    },
    allFake: function () {
      var deferred = $q.defer();
      var deps = new Array();
      var mapIds = {};

      $.getJSON("json/categories.json", function (data) {
        $.each(data, function (i, row) {
          deps[i] = { category_id: row.id, name: row.name };
          mapIds[deps[i].map_id] = deps[i].name;
        });
        deferred.resolve(deps);
      });

      return deferred.promise;
    }
  };
});
