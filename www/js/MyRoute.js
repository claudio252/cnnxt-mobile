/**
 * @fileOverview
 * Contains an application level helper class for displaying routes.
 * It is furnished as an example, and can be customized or used as a starting point by the developer.
 */

/**
 * @public
 * @name MyRoute
 * @class MyRoute Example class.
 * It allows the rendering of a route if available from computeRoute().
 * Creates a route object to simplify the display of line routes, start/end/change floor icons.
 * It uses for the media directory the value of vg.imagePath (by default "../media"), which contains:
 * <ul>
 * <li>image for route style: 2d_track_blue_boomerang.png
 * <li>images for pins for start, end of route and change floor
 * </ul>
 *
 * @see vg.mapviewer.Mapviewer.html#computeRoute
 * @param {vg.mapviewer.Mapviewer} mapviewer
 * @param {object} routeData, result of vg.mapviewer.Mapviewer.computeRoute()
 *
 * @example
<code>
pRouteData will have the form
{
    "name" : "Route Result",
    "src" : "LG002",
    "dst" : "LG011",
    "status" : "200",
    "legs" :[
     {
    	 "dataset" : "L",
    	 "points" : [{ "lat" : "5.1980516","lon" : "45.2789357" }, ... ]
     }
     , ...
    ],
     "length": "62.7925949"
}
</code>
 */
var MyRoute = function(pViewer, pRouteData)
{
	var imagePath = vg.imagePath || 'media';

	var trackImage = imagePath + '/track.png';
	var startImage = imagePath + '/track_start.png';
	var endImage = imagePath + '/track_end.png';
	var stairUpImage = imagePath + '/track_stair_up.png';
	var stairDownImage = imagePath + '/track_stair_down.png';
	var modalityChangeImage = imagePath + '/track_modality_change.png';
	// TODO have image for each modality, have RoutingServer also give you that information on the route.

	var showStartPin = true;
	var showEndPin = true;

	var routePinHeight = 3;

	function getFloorIndex(pName)
	{
		for (fi in mFloors)
		{
			var f = mFloors[fi];
			if (f.name == pName)
			{
				return f.index;
			}
		}
		return 0;
	}
	var mapviewer = pViewer;

	var mFloors = mapviewer.getFloors();

	var mOverlayRouteLines = [];
	var mOverlayRoutePOIs = [];

	var mValid = false;

	var mModalityChangeCounter = 0;
	var routeDataLegs = pRouteData['legs'];
	if (routeDataLegs !== undefined)
	{
		//console.log("New Route, length: "+pRouteData['length']);

		for (var l = 0,ll = routeDataLegs.length; l < ll; l++)
		{
			var routeDataLeg = routeDataLegs[l];
			var overlayPoints = [];
			var lCurrentFloorName = routeDataLeg['dataset'];
			var lCurrentFloorIndex = getFloorIndex(lCurrentFloorName);

			var routeDataLegPoints = routeDataLeg['points'];
			for(var j = 0, jl = routeDataLegPoints.length ; j < jl; j++)
			{
				var point = routeDataLegPoints[j];
				// transfor to new coordinates
				point = mapviewer.convertLatLonToPoint(point);

				overlayPoints.push(point);
			}

			if (overlayPoints.length>1)
			{
				var lSpeed = 1.0;
				// APM, travelator
				var lModality = routeDataLeg['modality'];
				switch(lModality)
				{
					case 'APM':
						lSpeed = 5.0;
						break;
					case 'shuttle':
						lSpeed = 5.0;
						break;
					case 'travelator':
						lSpeed = 3.0;
						break;
				}

				// Configure how the line looks
				var path_options = {
					floor: lCurrentFloorName,
					url: trackImage, // only available on vg.mapviewer.kiosk.Mapviewer
					speed: 0, // only available on vg.mapviewer.kiosk.Mapviewer
					repeat: -1, // only available on vg.mapviewer.kiosk.Mapviewer
					thickness: 2.0,

					//color: "#f00", // change the color of the line
					points: overlayPoints,

					// only available on vg.mapviewer.kiosk.Mapviewer, this makes it looks
					// better for sharp turns. Negative values will try to adapt the number of
					// segments to the length of the route, such that the absolute value
					// indicates the number of segments per "??unit??"
					segments: 1000
				};

				mOverlayRouteLines.push(
					mapviewer.addRoutingPath(path_options)
				);
			}

			// Start, first leg, first point
			if (l == 0 && showStartPin)
			{
				/* A start */
				mOverlayRoutePOIs.push(
					mapviewer.addPOI({
								floor: lCurrentFloorName,
								url: startImage,
								onObjectMouseUp: function(){alert('start');},
								//text: 'START',
								id: 'START',
								position: {x: overlayPoints[0].x, y: overlayPoints[0].y, z: routePinHeight},
								scale: 4.0,
								overlay: true
							})
					);
			}
			var lastPointIndex = overlayPoints.length - 1;
			if (l == (routeDataLegs.length - 1) && showEndPin)
			{
				/* B end */
				mOverlayRoutePOIs.push(
					mapviewer.addPOI({
								floor: lCurrentFloorName,
								url: endImage,
								onObjectMouseUp: function(){alert('end');},
								//text: 'END',
								id: 'END',
								position: {x: overlayPoints[lastPointIndex].x, y: overlayPoints[lastPointIndex].y, z: routePinHeight},
								scale: 4.0,
								overlay: true
							})
						);
			}

			//console.log('lCurrentFloorIndex '+lCurrentFloorIndex);
			if (routeDataLegs.length > 1)
			{
				if (l > 0)
				{

					var lPrevFloorName = routeDataLegs[l-1]['dataset'];
					var lPrevFloorIndex = getFloorIndex(lPrevFloorName);
					//console.log('lPrevFloorIndex '+lPrevFloorIndex);

					// go to previous, at beginning of line
					if (lPrevFloorIndex != lCurrentFloorIndex)
					{

						(function (prevFloorName, prevFloorIndex)
						 {
							 mOverlayRoutePOIs.push(
								 mapviewer.addPOI({
									 floor: lCurrentFloorName,
									 url: (prevFloorIndex > lCurrentFloorIndex) ? stairUpImage : stairDownImage,
									 id: 'GO TO PREV '+ lCurrentFloorName + '->' + prevFloorName,
									 onObjectMouseUp: function(){
										 mapviewer.changeFloor(prevFloorName).done(function() {
											if (typeof(updateActiveFloorLabel) == 'function')
											{
												 updateActiveFloorLabel(prevFloorName);
											}
										 });
									 },
									 position: {x: overlayPoints[0].x, y: overlayPoints[0].y, z: routePinHeight},
									 scale: 4.0,
									 overlay: true
								 })
							 );
						 })(lPrevFloorName, lPrevFloorIndex);
					}
					else
					{
						// Do modality change?
						mOverlayRoutePOIs.push(
							mapviewer.addPOI({
								floor: lCurrentFloorName,
								url: modalityChangeImage,
								id: 'MODALITYCHANGE '+ mModalityChangeCounter++,
								position: {x: overlayPoints[0].x, y: overlayPoints[0].y, z: routePinHeight},
								scale: 4.0,
								overlay: true
							})
						);
					}
				}
				if (l < (routeDataLegs.length - 1))
				{
					var lNextFloorName = routeDataLegs[l+1]['dataset'];
					var lNextFloorIndex = getFloorIndex(lNextFloorName);
					//console.log('lNextFloorIndex '+lNextFloorIndex);

					if (lNextFloorIndex != lCurrentFloorIndex)
					{
						(function (nextFloorName, nextFloorIndex)
						{
							// go to next
							mOverlayRoutePOIs.push(
								mapviewer.addPOI({
											floor: lCurrentFloorName,
											url: (nextFloorIndex > lCurrentFloorIndex) ? stairUpImage : stairDownImage,
											id: 'GO TO NEXT '+ lCurrentFloorName+'->'+ nextFloorName,
											onObjectMouseUp: function(){
												mapviewer.changeFloor(nextFloorName).done(function() {
													if (typeof(updateActiveFloorLabel) == 'function')
													{
														updateActiveFloorLabel(nextFloorName);
													}
												});

											},
											position: {x: overlayPoints[lastPointIndex].x, y: overlayPoints[lastPointIndex].y, z: routePinHeight},
											scale: 4.0,
											overlay: true
										})
									);
						})(lNextFloorName, lNextFloorIndex);
					}
				}
			}
		}
		mValid = true;
	}

	/**
	 * @public
	 * @name isValid
	 * @function
	 * @memberOf MyRoute#
	 * @description
	 * Determine if the object has been succesfully created AND is currently
	 * valid.
	 * @returns {Boolean} True if the object is valid, otherwise false.
	 */
	this['isValid'] = function()
	{
		return mValid;
	};

	/**
	 * @public
	 * @name show
	 * @function
	 * @memberOf MyRoute#
	 * @description
	 * Display the route if hidden
	 */
	this['show'] = function()
	{
		for (var i in mOverlayRoutePOIs)
		{
			mOverlayRoutePOIs[i].show();
		}
		for (var i in mOverlayRouteLines)
		{
			mOverlayRouteLines[i].show();
		}
	};

	/**
	 * @public
	 * @name hide
	 * @function
	 * @memberOf MyRoute#
	 * @description
	 * Hides the route if visible
	 */
	this['hide'] = function()
	{
		for (var i in mOverlayRoutePOIs)
		{
			mOverlayRoutePOIs[i].hide();
		}
		for (var i in mOverlayRouteLines)
		{
			mOverlayRouteLines[i].hide();
		}
	};

	/**
	 * @public
	 * @name remove
	 * @function
	 * @memberOf MyRoute#
	 * @description
	 * removes the route
	 */
	this['remove'] = function()
	{
		for (var i in mOverlayRoutePOIs)
		{
			mOverlayRoutePOIs[i].remove();
		}

		for (var i in mOverlayRouteLines)
		{
			mOverlayRouteLines[i].remove();
		}

		// Since it is a remove, clear the arrays to avoid calling remove twice.
		mOverlayRoutePOIs = [];
		mOverlayRouteLines = [];
	};

};
