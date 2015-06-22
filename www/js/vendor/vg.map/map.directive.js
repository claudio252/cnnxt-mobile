/**
 * @ngdoc directive
 * @name vg-map
 * @description
 *   Implementation of {@link MapController}
 *   Initialize a VisioGlobe map within a `<div>` tag with given options and register events
 *   It accepts children directives; marker, shape, or marker-clusterer
 *
 *   It initialize map, children tags, then emits message as soon as the action is done
 *   The message emitted from this directive is;
 *     . mapInitialized
 *
 *   Restrict To:
 *     Element
 *
 * @param {Expression} geo-callback if center is an address or current location, the expression is will be executed when geo-lookup is successful. e.g., geo-callback="showMyStoreInfo()"
 * @param {Array} geo-fallback-center
 *    The center of map incase geolocation failed. i.e. [0,0]
 * @param {String} init-event The name of event to initialize this map.
 *        If this option is given, the map won't be initialized until the event is received.
 *        To invoke the event, use $scope.$emit or $scope.$broacast.
 *        i.e. <map init-event="init-map" ng-click="$emit('init-map')" center=... ></map>
 * @param {String} &lt;MapOption> Any Google map options,
 *        https://developers.google.com/maps/documentation/javascript/reference?csw=1#MapOptions
 * @param {String} &lt;MapEvent> Any Google map events,
 *        https://rawgit.com/allenhwkim/angularjs-google-maps/master/build/map_events.html
 * @example
 * Usage:
 *   <map MAP_OPTIONS_OR_MAP_EVENTS ..>
 *     ... Any children directives
 *   </map>
 *
 * Example:
 *   <map center="[40.74, -74.18]" on-click="doThat()">
 *   </map>
 *
 *   <map geo-fallback-center="[40.74, -74.18]">
 *   </map>
 */
'use strict';

angular.module('cnnxtMobile').directive('vgMap', function ($compile) {

  return {
    restrict: 'AE',
    scope: {
      vgDestination: '=',
      vgOrigin: '=',
      vgDirection: '=',
      vgControls: '='
    },
    link: function (scope, element, attrs, controller) {

      scope.map = null;
      scope.currentNavigation = null;
      scope.currentRoute = null;

      scope.initializeMap = function () {
        element.append($compile('<div id="map-container"><div class="map-directions">' +
          '<div class="item item-button-left item-button-right">' +
          '<button class="button" ng-click="previousInstruction()"><i class="icon ion-chevron-left"></i></button>' +
          '<div id="instructions_detail" class="instructions"></div>' +
          '<button class="button" ng-click="nextInstruction()"><i class="icon ion-chevron-right"></i></button>' +
          '</div>' +
          '</div></div>')(scope));
        var mapEl = $('#map-container')[0];

        var directionsEl = $('.map-directions')[0];
        directionsEl.style.display = scope.vgControls?'block':'none';

        scope.map = new vg.mapviewer.web.Mapviewer();
        scope.map.initialize(element.find('#map-container')[0], {
          path: mapOptions.path,
          initialFloorName: mapOptions.initialFloor
        }).done(function () {
          scope.map.resize(mapEl.style.width, mapEl.style.height);

          scope.$watchGroup(['vgOrigin', 'vgDestination'], function (newValues, oldValues) {
            if (newValues[0] && newValues[1]) {
              var origin = scope.getPlace(newValues[0]);
              var destination = scope.getPlace(newValues[1]);

              scope.calculateRoute(origin, destination);
            }
          });

          scope.$watch('vgDirection', function (newValue, oldValue, scope) {
            if (newValue) {
              var place = scope.getPlace(newValue);
              scope.setActivePosition(place);
            }
          });

          scope.$emit('vg:initialized');
        }).fail(function (error) {
          scope.$emit('vg:error');
        });
      }

      scope.setPosition = function (place) {
        var position = scope.map.camera.position;

        position.radius = scope.map.camera.minRadius;

        position.x = place.vg.position.x;
        position.y = place.vg.position.y;

        scope.map.camera.position = position;
      }

      scope.setActivePosition = function (place) {
        scope.map.highlight(place, 0x00FF00, { opacity: 0.5 });
        scope.setPosition(place);
      }

      scope.nextInstruction = function () {
        scope.currentNavigation.displayNextInstruction();
      }

      scope.previousInstruction = function () {
        scope.currentNavigation.displayPrevInstruction();
      }

      scope.calculateRoute = function (origin, destination) {
        var lRouteRequest = {};

        var currentRoute = null;

        lRouteRequest.src = origin.vg.id;
        lRouteRequest.dst = destination.vg.id;

        lRouteRequest.computeNavigation = true;

        //Override certain navigation parameters
        lRouteRequest.navigationParameters = lRouteRequest.navigationParameters || {};
        lRouteRequest.navigationParameters.modalityParameters = lRouteRequest.navigationParameters.mModalityParameters || {};

        lRouteRequest.navigationParameters.modalityParameters.shuttle = lRouteRequest.navigationParameters.modalityParameters.shuttle || {};
        lRouteRequest.navigationParameters.modalityParameters.shuttle.straightAngleThreshold = lRouteRequest.navigationParameters.modalityParameters.shuttle.straightAngleThreshold || 180.0;
        lRouteRequest.navigationParameters.modalityParameters.shuttle.distanceFromCouloirThreshold = lRouteRequest.navigationParameters.modalityParameters.shuttle.distanceFromCouloirThreshold || 1000.0;

        // Changed default straightAngleThreshold
        var modalities = scope.map.getRoutingModalities();
        var modalityParameters = lRouteRequest.navigationParameters.modalityParameters;
        for (var i in modalities) {
          var modality = modalities[i];
          modalityParameters[modality] = modalityParameters[modality] || {};
          modalityParameters[modality].straightAngleThreshold = modalityParameters[modality].straightAngleThreshold || 30.0;
        }

        scope.map.computeRoute(lRouteRequest).fail(function (pRouteRequest) {
          console.log('Sorry, there are problems with Routing Server');
        }).done(function (pRouteRequest, pRouteData) {
          if (scope.currentRoute !== null) {
            scope.currentRoute.remove();
          }

          if (scope.currentNavigation !== null) {
            scope.currentNavigation.remove();
          }

          if (pRouteData.status && pRouteData.status !== 200) {
            console.log('Sorry, no route available between ' + pRouteRequest.src + ' and ' + pRouteRequest.dst + '.');
            return;
          }

          scope.currentRoute = new MyRoute(scope.map, pRouteData);

          if (scope.currentRoute.isValid()) {
            scope.currentRoute.show();
            scope.setPosition(origin);

            scope.currentNavigation = new MyNavigation(scope.map, pRouteData);
          } else {
            console.log('Problems rendering the route between ' + pRouteRequest.src + ' and ' + pRouteRequest.dst + '.')
          }
        });
      }

      scope.getPlace = function (placeId) {
        return scope.map.getPlace(placeId);
      }

      if (element.find('#map-container').length === 0) {
        var mapOptions = {
          path: 'data.bundles/map.tiles.json',
          initialFloorName: '0'
        };

        var mapEvents = {};
        scope.initializeMap(mapOptions, mapEvents);
      }
    }
  }
});



