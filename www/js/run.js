'use strict';

angular.module('cnnxtMobile').run(function ($state, $rootScope) {

    // Handle States
    $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {

      var toName = toState.name;
      var fromName = fromState.name;

      console.log('GOING TO: ' + toName);
      console.log('FROM TO: ' + fromName);
      if (toName === 'dashboard.home' && fromName !== '') {
        console.log('CLEAR VIEWS!!!');
        $rootScope.$broadcast('clear:view', toParams);
      }
    });

    $rootScope.$on('$stateChangeError', function (event, toState, toParams, fromState, fromParams, error) {
      if (error.status === 404) {
        console.log('NEED TO ADD A BUMMER PAGE');
      }
    });
  });
