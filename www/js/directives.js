/* This adds a new directive, 'ion-search', which allows the user to search from a custom method */
angular.module('cnnxtMobile').directive('ionSearch', function() {
    return {
        restrict: 'E',
        replace: true,
        scope: {
          getData: '&source',
          model: '=?',
          search: '=?filter'
        },
        link: function(scope, element, attrs) {
            attrs.minLength = attrs.minLength || 0;
            scope.placeholder = attrs.placeholder || '';
            scope.message = attrs.message || '';
            scope.search = {
              value: ''
            };
            if (attrs.class) element.addClass(attrs.class);
            if (attrs.source) {
              scope.$watch('search.value', function(newValue, oldValue) {
                if (newValue.length > attrs.minLength || (newValue.length === 0 && oldValue.length !== 0)) {
                    scope.getData({
                      str: newValue
                    }).then(function(results) {
                      scope.model = results;
                    });
                } else {
                  scope.model = [];
                }
              });

              scope.$watch('focus', function (newValue, oldValue) {
                if (newValue) {
                  scope.getData({
                    str: ''
                  }).then(function(results) {
                    scope.model = results;
                  });
                } else {
                  if (scope.search.value === '' && oldValue === false) {
                    scope.model = [];
                  }
                }
              });
            }

            scope.clearSearch = function () {
              scope.search.value = '';
            };
        },
        template: '<div class="list list-inset input-search-padded">' +
          '<h4>{{message}}</h4>' +
          '<label class="item item-input">' +
          '<i class="icon ion-search placeholder-icon"></i>' +
          '<input type="search" placeholder="{{placeholder}}" ng-model="search.value" ng-init="focus=false" ng-focus="focus=true" ng-blur="focus=false">' +
          '</label><div class="list">' +
          '<div ng-repeat="department in model">' +
          '<a class="item item-icon-right" ng-init="isClosed=true" ng-click="focus=true;isClosed=!isClosed">' +
          '{{ department.name }}' +
          '<i class="icon ion-chevron-down" ng-class="{\'ion-chevron-down\': isClosed, \'ion-chevron-up\': !isClosed}"></i>' +
          '</a>' +
          '<ion-list class="inner-list">' +
          '<ion-item class="item-accordion" ng-repeat="category in department.categories" ng-show="!isClosed" ng-click="search.value=category.name">' +
          '<span>{{ category.name }}</span>' +
          '</ion-item>' +
          '</ion-list>' +
          '</div>'+
          '</div>' +
          '</div>'
    };
});