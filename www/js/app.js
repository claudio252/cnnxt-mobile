// 'cnnxtMobile.services' is found in services.js
// 'cnnxtMobile.controllers' is found in controllers.js
angular.module('cnnxtMobile', ['ionic', 'restangular', 'angular-md5', 'base64', 'cnnxtMobile.constants', 'cnnxtMobile.controllers', 'cnnxtMobile.services'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleLightContent();
    }
  });
})

.config(function($stateProvider, $urlRouterProvider, RestangularProvider, CORE_API_ENDPOINT, CORE_DEMO_ENDPOINT, LOCAL_API_ENDPOINT) {

  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider
    .state('dashboard', {
      url: '/dashboard',
      abstract: true,
      templateUrl: 'templates/dashboard.html'
    })
    .state('dashboard.home', {
      url: '/home?destination',
      params: {
        destination: null
      },
      views: {
        'dashboard-view': {
          templateUrl: 'templates/home.html',
          controller: 'HomeCtrl'
        }
      }
    })
    .state('dashboard.departments', {
      url: "/departments",
      views: {
        'dashboard-view': {
          templateUrl: 'templates/departments.html',
          controller: 'DepartmentsCtrl'
        }
      }
    })
    .state('dashboard.department', {
      url: "/department/:department/details",
      views: {
        'dashboard-view': {
          templateUrl: 'templates/department.html',
          controller: 'DepartmentCtrl'
        }
      }
    })
    .state('dashboard.directions', {
      url: '/directions?locations',
      params: {
        locations: null
      },
      views: {
        'dashboard-view': {
          templateUrl: 'templates/maps.html',
          controller: 'DirectionsCtrl'
        }
      }
    })
    .state('dashboard.direction', {
      url: '/direction?location',
      params: {
        location: null
      },
      views: {
        'dashboard-view': {
          templateUrl: 'templates/map.html',
          controller: 'DirectionCtrl'
        }
      }
    })
    .state('dashboard.test', {
      url: '/test?direction',
      params: {
        direction: null
      },
      views: {
        'dashboard-view': {
          controller: 'TestCtrl',
          templateUrl: 'templates/test.html'
        }
      }
    });

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/dashboard/home');

  // RestangularProvider.setBaseUrl(CORE_DEMO_ENDPOINT);
  RestangularProvider.setBaseUrl(LOCAL_API_ENDPOINT);
});
