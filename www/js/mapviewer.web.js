/*
	mapviewer sample.
*/

var mapviewer;
var vg_ids;
var currentNavigation;
var currentRoute = null;
var doRouting;

var bundleName = 'visioglobe_island_tiles';

// The labels URL is local
var labelsURL = '../data.bundles/'+bundleName+'/ids.json';

// The mapURL is remote, it also has routing.  generic sample
//var mapURL = '//mapmanager.visioglobe.com/public/124bfe895720b075/content/map.svg';
// The mapURL is remote, it also has routing.  Visio Island
// The old VisioIsland URL has been deprecated
//var mapURL = '//mapmanager.visioglobe.com/public/dec0270861f45d13/content/map.svg';

// New VisioIsland URL with off-line routing:
var mapURL = '//mapmanager.visioglobe.com/public/web2d15037fdebfd/content/map.tiles.json';

// Local Bundle, no routing unless mapviewer.setRoutingURL with right parameters is called
//var mapURL =  '../data.bundles/'+bundleName+'/map.svg';

// passes this paramter to mapviewer.initialize to select the initial floor.
var initialFloorName = '0';

// activate the turn by turn navigation if available
var useNavigation = true;





var changeFloorAnimationDuration = 500; // change floor animation duration in ms.  does nothing on VisioWeb SDK
var sample_poi; // reference to one of the sample_poi, you can do sample_poi.hide()/show()

var need_labels = true;
var need_mouseover = true;
var force_mouseover = false;
var need_click = true;
var fill_list = true; // we can disable it on low end mobile devices as filling a 1000 options list can take minutes

// Shops that are currently highlighted.
var highlighted_shop = null;
var active_shop = null;
var floor_button_ids = {};
var statusbar_timeout = null;
var place_poi;

/*
 * test support for DefineProperty, this is not available on IE8
 * and means certain actions cannot be done, or retrieving certain values
 * is not possible.
 */
var supportsDefineProperty = true;
try
{
    Object.defineProperty({}, 'x', {});
} catch(e) {
	// You may want to remove this alert once testing is done.
	alert('Warning: Browser (IE8 or below?) has no/partial support for Object.define property, a key javascript feature.  This page will probably not work');
    supportsDefineProperty = false;
}

// Redefine console for browsers like IE8 who don't have it.  Normally done outside framework.
var console=window.console||{"log":function(){}};





jQuery(document).ready(function()
{
	// make VisioWeb the default:
	if (vg && vg.mapviewer && vg.mapviewer.web)
	{
		vg.mapviewer.Mapviewer = vg.mapviewer.web.Mapviewer;
	}

	/*
		This could could allow you to use the same javascript for both VisioWeb and VisioKiosk
	var query = jQuery.deparam.querystring();
	if (typeof query.kiosk != 'undefined' && vg && vg.mapviewer && vg.mapviewer.kiosk)
	{
		vg.mapviewer.Mapviewer = vg.mapviewer.kiosk.Mapviewer;
	}
	if (typeof query.web != 'undefined' && vg && vg.mapviewer && vg.mapviewer.web)
	{
		vg.mapviewer.Mapviewer = vg.mapviewer.web.Mapviewer;
	}
	*/
});

/*
 * Customizes how the map looks at the beginning.
 */
function setupInitialPosition()
{
	// Shops that are highlighted at the start/load of the page.
	// this value could come from an external parameter. (used to be 114)
	setActiveShop(mapviewer.getPlace('UL0-ID0014'));

    // if you wanted to start on another floor, do it here or pass parameter initialFloor to mapviewer.initialize()
    // mapviewer.camera.goTo({x: 0.1, y: 0.1, radius: 100});

    // add POI on another floor (used to be 161)
    var p = mapviewer.getPlace('UL1-ID0064');
    if (p)
    {
	    sample_poi = mapviewer.addPOI({selector: '#test', floor: p.vg.floor, position: p.vg.position});
    }

	// Top left corner of shop 161. {lat: 48.78295439400996, lon: 2.222107906181293}
	// Top left corner of Museum {lat: 45.74230960774532, lon: 4.884392885060976}
	var pos = mapviewer.convertLatLonToPoint( {lat: 45.74230960774532, lon: 4.884392885060976} );
	mapviewer.addPOI({selector: '#testNE', floor: "0", position: pos, alignment: {x:1,y:1}});
	mapviewer.addPOI({selector: '#testSE', floor: "0", position: pos, alignment: {x:1,y:-1}});
	mapviewer.addPOI({selector: '#testSW', floor: "0", position: pos, alignment: {x:-1,y:-1}});
	mapviewer.addPOI({selector: '#testNW', floor: "0", position: pos, alignment: {x:-1,y:1}});
	mapviewer.addPOI({selector: '#testMiddleTop', floor: "0", position: pos, alignment: {x:0,y:1}});

    // example of setPlaceIcon
    mapviewer.setPlaceIcon('UL0-ID0077','../media/test.png',{width: '64px',height: '64px'});

    /* VisioWeb maps initial radius shows the whole map on 256x256 pixels of the map view.
       to make it more responsive, we normalize by the current map view size
    var mapViewSizeFactor = Math.min(jQuery('#container').width(), jQuery('#container').height()) / 256.0;
    var pos = mapviewer.camera.position;
    pos.radius = pos.radius / mapViewSizeFactor;
    mapviewer.camera.position = pos;
    */
    // to set specific camera start position (you can control intitial floor via variable initialFloorName)
    //var pos = mapviewer.convertLatLonToPoint( {lat: 48.78295439400996, lon: 2.222107906181293});
	//pos.radius = 51.2;
    //mapviewer.camera.position = pos;
}

/*
 * Simple example:
 * shops can be highlighted (browsing), or active (the user is interested)
 */
function setActiveShop(shop)
{
	if (shop == active_shop)
	{
		return;
	}

	resetActiveShop();
	if (typeof(shop) != 'undefined' && shop !== false)
	{
		mapviewer.highlight(shop, 0x00FF00, {opacity: 0.5});
		active_shop = shop;
		// a shop cannot be highlighted and active at the same time.
		if (highlighted_shop == active_shop)
		{
			highlighted_shop = null;
		}

		var shop_id = shop.vg.id;
		jQuery('.shop_link').each(function(i,entry) { if (jQuery(entry).attr("data-id") ==  shop_id) { jQuery(entry).addClass('selected');  return false; }   });

	}
}

function resetActiveShop()
{
	if (active_shop !== null)
	{
		mapviewer.removeHighlight(active_shop);
		active_shop = null;
	}


	// deactivate item on list.
	jQuery('.shop_link').removeClass('selected');

}

function setHighlightedShop(shop)
{
	if (shop instanceof Array ||
		(shop.vg && shop.vg.poi))
	{
		return;
	}
	if (shop == highlighted_shop)
	{
		return;
	}
	resetHighlightedShop();
	if (typeof(shop) != 'undefined' && shop != active_shop)
	{
		mapviewer.highlight(shop, 0xFFFFFF - shop.vg.originalColor, {opacity: 0.5});
		highlighted_shop = shop;
	}
}

function resetHighlightedShop()
{
	if (highlighted_shop !== null)
	{
		mapviewer.removeHighlight(highlighted_shop);
		highlighted_shop = null;
	}
}

// place can be string or Place object
var openPlaceBubble = function(place)
{
	var result = false;
	if (typeof(place) != 'undefined' && place !== false)
	{
		if (typeof(place) == 'string')
		{
			place = mapviewer.getPlace(place);
			if (place === false)
			{
				return result;
			}
		}
		// destroy previous bubble.
		closePlaceBubble();
		var id = place.vg.id;

		// alignment, bottom middle
		place_poi = mapviewer.addPOI({selector: '#place_bubble', floor: place.vg.floor, position: place.vg.position, alignment: {x: 0, y: 1.0}});
		//console.log('addPOI floor '+place.vg.floor+ ' position '+place.vg.position.x + ', '+place.vg.position.y);
		jQuery('#place_bubble_title').html('ID: '+id);


		if (mapviewer.getRoutingNode(id) !== false)
		{
			// node is routable
			jQuery('#place_bubble_set_origin').attr('vg_id',id);
			jQuery('#place_bubble_set_destination').attr('vg_id',id);
			jQuery('#place_bubble_set_origin').prop('disabled',false).css('opacity','1.0');
			jQuery('#place_bubble_set_destination').prop('disabled',false).css('opacity','1.0');
		}
		else
		{
			// node is not routable
			jQuery('#place_bubble_set_origin').attr('vg_id','');
			jQuery('#place_bubble_set_destination').attr('vg_id','');
			jQuery('#place_bubble_set_origin').prop('disabled',true).css('opacity','0.4');
			jQuery('#place_bubble_set_destination').prop('disabled',true).css('opacity','0.4');
		}

		result = true;
	}
	return result;
}

var closePlaceBubble = function()
{
	if (place_poi)
	{
		place_poi.remove();
		place_poi = false;
	}
}


function onObjectMouseOver(event, element)
{
	// We'll be notified of highlighting for all objects.
	//console.log("mouse over " + element);
	// We avoid highlighting POIs
	//console.log(element);
	if (element instanceof Array ||
		(element.vg && element.vg.poi))
	{
		return false;
	}

	// var id = false;
	// var isPlace = false;
	// if (element.vg && typeof(element.vg.id)!=='undefined')
	// {
	// 	id = element.vg.id;
	// 	isPlace = true;
	// }
	// else if (element.options && typeof(element.options('id')) !=='undefined')
	// {
	// 	id = element.options('id');
	// }

	//if (id.match(/CUT/) !== null || id.match(/VP/) !== null)
	//{
	//	// ignore certain ids, for example CUT and VP
	//	return;
	//}

	if (statusbar_timeout!==null)
	{
		//console.log("*** clear");
		clearTimeout(statusbar_timeout);
		statusbar_timeout = null;
	}

	jQuery('#vg_statusbar').animate({
		top: '-100px'
	});

	//console.log("*** ObjectOver "+element.vg.id);
	setHighlightedShop(element);

	var html = '';
	if (typeof(vg_ids)!='undefined' && typeof(vg_ids.labels[element.vg.id])!='undefined')
	{
		var labels = vg_ids.labels[element.vg.id];
		html += '<h4>Element name='+labels[1]+'</h4>';
	}
	else
	{
		html += '<h4>Element ID='+element.vg.id+'</h4>';
	}
	jQuery('#vg_statusbar .info').html(html);
}

function onObjectMouseOut(event,element)
{
	if (element instanceof Array ||
		(element.vg && element.vg.poi))
	{
		return false;
	}

	if (statusbar_timeout===null)
	{
		statusbar_timeout = setTimeout(function() {
			//console.log("*** hide");
			jQuery('#vg_statusbar').clearQueue().animate({
				top: '70px'
			});
		}, 1000);
	}

	//console.log("*** ObjectOut "+element.vg.id);
	resetHighlightedShop();
}

function onObjectMouseUp(event, element)
{
	// var id = false;
	// var isPlace = false;
	// if (element.vg && typeof(element.vg.id)!=='undefined')
	// {
	// 	id = element.vg.id;
	// 	isPlace = true;
	// }
	// else if (element.options && typeof(element.options('id')) !=='undefined')
	// {
	// 	id = element.options('id');
	// }

	// if (id.match(/CUT/) !== null || id.match(/VP/) !== null)
	// {
	// 	// ignore CUT and VP.
	// 	return;
	// }



	if (element.vg && typeof(element.vg.id)!=='undefined')
	{
		jQuery('#vg_search-input').val(element.vg.id);
	}
	//console.log("mouseUp on "+element.vg.id);

	// we don't need to potentially call change floor as we are guaranteed to be on the same floor
	openPlaceBubble(element);
	setActiveShop(element);
	mapviewer.camera.goTo(element);
	// conserve altitude
	//var target_position = {
	//	x: element.vg.position.x,
	//	y: element.vg.position.y,
	//	radius: mapviewer.camera.position.radius
	//};
	//mapviewer.camera.goTo(target_position);
}

/**
 * Go to that shop.  change floor if needed
 */

function gotoFloorAndPosition(floorname,position,postFunction)
{
	var gotoFunction = function()
	{
		mapviewer.camera.goTo(position,{animationDuration: 500}).done(function()
			{
				if (typeof(postFunction) === 'function')
				{
					postFunction();
				}
			});
	};

	if (mapviewer.getCurrentFloor() == floorname)
	{
		gotoFunction();
	}
	else
	{
		mapviewer.changeFloor(floorname).done(function()
			{
				updateActiveFloorLabel(floorname);
				gotoFunction();
			});
	}
}
function selectShop(shopName)
{

	//console.log("LinkClick "+shop_id);
	var shop = mapviewer.getPlace(shopName);
	resetActiveShop();
	var that = this;
	if (shop!==false)
	{
		gotoFloorAndPosition(shop.vg.floor,shop, function() { setActiveShop(shop); });
	}
}

function onLoadCompleted()
{
	jQuery('#progress').hide();

	jQuery('#vg_footer').on('click', '.change_floor', function() {
		var target_floor = jQuery(this).attr('data-floor');
		mapviewer.changeFloor(target_floor,{animationDuration: changeFloorAnimationDuration}).done(function() { updateActiveFloorLabel(target_floor);});
		return false;
	});

	jQuery('#vg_sidebar').on('mouseenter', '.shop_link', function() {
		var shop_id = jQuery(this).attr('data-id');
		//console.log("LinkMouseEnter "+shop_id);
		var shop = mapviewer.getPlace(shop_id);
		setHighlightedShop(shop);

		return false;
	});

	jQuery('#vg_sidebar').on('mouseleave', '.shop_link', function() {
		var shop_id = jQuery(this).attr('data-id');
		//console.log("LinkMouseLeave "+shop_id);
		resetHighlightedShop();

		return false;
	});

	jQuery('#vg_sidebar').on('click', '.shop_link', function() {
		var shop_id = jQuery(this).attr('data-id');
		selectShop(shop_id);

		return false;
	});

	// Setup Change floor buttons.
	jQuery('#change_floor').empty();
	var floors = mapviewer.getFloors();
	for (var i in floors)
	{
		var floor = floors[i];
		createFloorLabel(floor.name);
	}
	jQuery('#floor_container').show();

	/* This code does not apply to VisioWeb SDK (only VisioKiosk)
	if (!mapviewer.isAccelerated)
	{
		mapviewer.camera.pitch = -90;
		mapviewer.camera.pitchManipulatorEnabled = false;
		// we can allow rotation.
		mapviewer.camera.rotationManipulatorEnabled = false;
	}
	*/
	// select first floor by default
	updateActiveFloorLabel(mapviewer.getCurrentFloor());

	// Start the rendering of the map.
	mapviewer.start();

	jQuery(window).resize(function(event) {
		mapviewer.resize(jQuery('#container').width(), jQuery('#container').height());
	});

	setupInitialPosition();

	var fill_comboboxes = function()
	{
		if (fill_list == false)
		{
			// test to see if src/dst were passed as parameters
			doRoutingFromURLParameters();
			return;
		}
		var allPlaces = mapviewer.getAllPlaces();
		var additional_content = '';
		for (var id in allPlaces)
		{
			var name = id;
			if (typeof(vg_ids)!='undefined')
			{
				var labels = vg_ids.labels[id];
				if (typeof(labels)!='undefined')
				{
					name = labels[1];
				}
			}
			additional_content += '<option value="'+id+'">'+name+'</option>';
		}
		if (typeof additional_content != 'undefined')
		{
			jQuery("#vg_search").append(additional_content);
			jQuery("#vg_route_from").append(additional_content);
			jQuery("#vg_route_to").append(additional_content);
		}
		// we do it after filling comboboxes so it can preselect the values
		// test to see if src/dst were passed as parameters
		doRoutingFromURLParameters();
	};

	// Routing will work on remote URLs and on local bundles, if a routing URL has been set.
	if (mapviewer.getRoutingURL()!='')
	{
		jQuery( "#vg_route_to" ).bind("comboboxselected",function(event,data,c){
			doRouting();
		});
		jQuery( "#vg_route_from" ).bind("comboboxselected",function(event,data,c){
			doRouting();
		});

		jQuery( "#vg_route_to" ).bind("comboboxcleared",function(event,data,c){
			clearRouting();
		});
		jQuery( "#vg_route_from" ).bind("comboboxcleared",function(event,data,c){
			clearRouting();
		});
		// Firefox clear combobox bug
		// There should be a better solution, this is somewhat heavy.
		jQuery( "#vg_route_to ~ span > a > span.ui-icon-close" ).on('mouseup',function(event,data,c){
			clearRouting();
			return false;
		});
		jQuery( "#vg_route_from ~ span > a > span.ui-icon-close" ).on('mouseup',function(event,data,c){
			clearRouting();
			return false;
		});

		///////////// NAVIGATION
		if (useNavigation)
		{
			jQuery('#instructions_prev_button').on('click', null, function() {
				if (typeof(currentNavigation) == 'object' && currentNavigation !== null)
				{
					currentNavigation.displayPrevInstruction();
				}
				return false;
			});
			jQuery('#instructions_next_button').on('click', null, function() {
				if (typeof(currentNavigation) == 'object' && currentNavigation !== null)
				{
					currentNavigation.displayNextInstruction();
				}
				return false;
			});
			jQuery('#toggle_instructions').on('click', null, function() {
				instructions_overlay_visible = !instructions_overlay_visible;
				if (currentRoute != null)
				{
					updateToggleInstructions();
				}
				return true;
			});
		}
		jQuery('#selectors #route').show();
		jQuery('#vg_sidebar_routing').show();
		jQuery('#clear_route_button').show();
	}
	else
	{
		jQuery('#vg_sidebar_routing').hide();

		closePlaceBubble = function(){};
		openPlaceBubble = function(){};
	}

	jQuery('#place_bubble_set_origin').on('click', null, function() {
		var id = jQuery(this).attr('vg_id');

		// preselect comboboxes if exist
		var srcBox = jQuery('#vg_route_from');
		var srcIndex = jQuery('option[value="'+id+'"]',srcBox).index();
		if (srcIndex != -1)
		{
			var srcBox0 = srcBox[0];
  			srcBox0.selectedIndex = srcIndex;

  			jQuery('#vg_route_from-input').val(jQuery(srcBox0[srcIndex]).val());
		}
		closePlaceBubble();
		doRouting();
		return false;
	});
	jQuery('#place_bubble_set_destination').on('click', null, function() {
		var id = jQuery(this).attr('vg_id');

		// preselect comboboxes if exist
		var dstBox = jQuery('#vg_route_to');
		var dstIndex = jQuery('option[value="'+id+'"]',dstBox).index();
		if (dstIndex != -1)
		{
			var dstBox0 = dstBox[0];
  			dstBox0.selectedIndex = dstIndex;
  			jQuery('#vg_route_to-input').val(jQuery(dstBox0[dstIndex]).val());
		}
		closePlaceBubble();
		doRouting();
		return false;
	});
	jQuery('#place_bubble_close_button').on('click', null, function()
	{
		closePlaceBubble();
		return false;
	});


	var doSelectShop = function()
	{
	  //console.log('doSelectShop');
	  var jc = jQuery( "#vg_search" )[0];
	  var opt = jc[jc.selectedIndex];
	  var value = opt.value;
	  if (value != "")
	  {
		selectShop(value);
		//mapviewer.camera.goTo(value);
	  }
 	}
 	jQuery( "#vg_search" ).bind("comboboxselected", doSelectShop);
 	jQuery( "#vg_search" ).bind("comboboxcleared", function() {
		//console.log('clear shop');
		resetActiveShop();
	});
	// Firefox clear combobox bug
	// There should be a better solution, this is somewhat heavy.
	jQuery( "#vg_search ~ span > a > span.ui-icon-close" ).on('mouseup',function(event,data,c){
		resetActiveShop();
		return false;
	});


 	doRouting = function(shop_src,shop_dst) {
 		// if no parameters use values on combobox
 		if (shop_src === undefined && shop_dst === undefined)
 		{
 			var jc = jQuery( "#vg_route_from" )[0];
			var opt = jc[jc.selectedIndex];
			var value = opt.value;
			shop_src = value;

			jc = jQuery( "#vg_route_to" )[0];
			opt = jc[jc.selectedIndex];
			value = opt.value;
			shop_dst = value;
 		}


		if (shop_dst == "" || shop_src == "")
		{
			return;
		}

		var lRouteRequest = {};
		lRouteRequest.src = shop_src;//lLastSelectedPlace;
		lRouteRequest.dst = shop_dst;//lSelectedPlace;

		lRouteRequest.routingParameters = {};
		if (handicap_routing)
		{
			// NOTE: make sure the map has these attributes (with the exact case and spelling)
			lRouteRequest.routingParameters.excludedAttributes = ['escalator','stairway'];
		}
		lRouteRequest.computeNavigation = true;

		// Override certain navigation parameters
		lRouteRequest.navigationParameters = lRouteRequest.navigationParameters || {};
		lRouteRequest.navigationParameters.modalityParameters = lRouteRequest.navigationParameters.mModalityParameters || {};

		lRouteRequest.navigationParameters.modalityParameters.shuttle = lRouteRequest.navigationParameters.modalityParameters.shuttle || {};
		lRouteRequest.navigationParameters.modalityParameters.shuttle.straightAngleThreshold = lRouteRequest.navigationParameters.modalityParameters.shuttle.straightAngleThreshold || 180.0;
		lRouteRequest.navigationParameters.modalityParameters.shuttle.distanceFromCouloirThreshold = lRouteRequest.navigationParameters.modalityParameters.shuttle.distanceFromCouloirThreshold || 1000.0;

		// Changed default straightAngleThreshold
		var modalities = mapviewer.getRoutingModalities();
		var modalityParameters = lRouteRequest.navigationParameters.modalityParameters;
		for (var i in modalities)
		{
			var modality = modalities[i];
			modalityParameters[modality] = modalityParameters[modality] || {};
			modalityParameters[modality].straightAngleThreshold = modalityParameters[modality].straightAngleThreshold || 30.0;
		}

		mapviewer.computeRoute(lRouteRequest)
		.fail(function(pRouteRequest)
		{
			alert("Sorry, there are problems with Routing Server");
		})
		.done(function(pRouteRequest, pRouteData)
		{
			//alert("Success "+ pRouteData);

			if (currentRoute != null)
			{
				currentRoute.remove();
			}
			if (currentNavigation != null)
			{
				currentNavigation.remove();
			}

			if (pRouteData.status && pRouteData.status != 200)
			{
				alert("Sorry, no route available between " + pRouteRequest.src + " and " + pRouteRequest.dst + ".");
				return;
			}

			currentRoute = new MyRoute(mapviewer,pRouteData);
			if (currentRoute.isValid())
			{
				currentRoute.show();

				var startRouteAtFirstShop = true;
				if (startRouteAtFirstShop)
				{
					selectShop(shop_src);
				}
				else
				{
					setActiveShop(mapviewer.getPlace(shop_src));
					var viewpoint = currentRoute.getInitialViewpointPosition();
					var floorname = currentRoute.getInitialFloor();
					gotoFloorAndPosition(floorname,viewpoint);
				}

				if (useNavigation)
				{
					currentNavigation = new MyNavigation(mapviewer,pRouteData,vg_ids);
					instructions_overlay_visible = true;
					updateToggleInstructions();
				}
			}
			else
			{
				alert("Problems rendering the route between "+pRouteRequest.src + " and " + pRouteRequest.dst + ".");
			}
		});
    }

	function clearRouting()
	{
		// remove current Route
		if (currentRoute != null)
		{
			currentRoute.remove();
			currentRoute = null;
		}
		// hide navigation instructions
		if (useNavigation)
		{
			instructions_overlay_visible = false;
			updateToggleInstructions();
			if (currentNavigation != null)
			{
				currentNavigation.remove();
				currentNavigation = null;
			}
		}
	}

	// needs to be called after comboboxes have been filled.
	// this method is complicated by the fact that we want to update the UI
	// and that the doRouting() function uses the UI for its parameters
	function doRoutingFromURLParameters()
	{
		// Compute routing is passed as parameter
		var query = jQuery.deparam.querystring();
		if (typeof query.src != 'undefined' && typeof query.dst != 'undefined')
		{
			// preselect comboboxes if exist
			var srcBox = jQuery('#vg_route_from');
			var dstBox = jQuery('#vg_route_to');

			var srcIndex = jQuery('option[value="'+query.src+'"]',srcBox).index();
			var dstIndex = jQuery('option[value="'+query.dst+'"]',dstBox).index();
			if (srcIndex != -1 && dstIndex != -1)
			{
				var srcBox0 = srcBox[0];
				var dstBox0 = dstBox[0];
	  			srcBox0.selectedIndex = srcIndex;
	  			dstBox0.selectedIndex = dstIndex;

	  			jQuery('#vg_route_from-input').val(jQuery(srcBox0[srcIndex]).val());
	  			jQuery('#vg_route_to-input').val(jQuery(dstBox0[dstIndex]).val());
			}
			// do actual routing.
  			doRouting(query.src,query.dst);

		}
	}


	// Display shop list.
	var lLoadIDs = true;
	if (lLoadIDs)
	{
		jQuery.ajax(labelsURL, {
			dataType: 'json',
			success: function(data, textStatus, jqXHR) {
				if (data==null)
				{
					return;
				}
				vg_ids = data;
				var shoplist = '';

				var add_spaces = false;
				var query = jQuery.deparam.querystring();
				if (typeof(query.addspaces) != 'undefined')
				{
					add_spaces = true;
				}

				for (var i in vg_ids.labels)
				{
					var id = vg_ids.labels[i][0];
					var label = vg_ids.labels[i][1];
					var shop = mapviewer.getPlace(id);
					var floornumber = '';
					if (shop !== false)
					{
						floornumber += ' ('+id+'/'+shop.vg.floor+')';
					}
					else
					{
						floornumber += ' ('+id+'+/missing)';
					}

					if (need_labels)
					{
						if (add_spaces)
						{
							// This is only supported in VisioWeb.
							label = label.replace(/ /g,'<br>');
						}
						mapviewer.setPlaceName(id, label);
					}
					shoplist += '<a href="#" class="shop_link" data-id="'+id+'">'+label+''+floornumber+'</a><br/>';
				}
				jQuery('#shop_list').append(shoplist);

				// combo boxes needs to be called after filling vg_ids so it can use the real shop/place name on the menu.
				fill_comboboxes();
			},
			error: function() {
				if (need_labels)
				{
					var places = mapviewer.getAllPlaces();
					for (var placename in places)
					{
						mapviewer.setPlaceName(placename, placename);
					}
				}
				// without vg_ids, fill_comboboxes will use the place id as its name.
				fill_comboboxes();
			}
		});
	}
	else
	{
		// This is sample code to set the placename to be the same as its id.
		// One can change the style of setPlaceName text via the class .vg-setplacename
		// jQuery('.vg-setplacename').css('font-size','18px')
		var debug_ids_on_error = false;
		if (debug_ids_on_error && need_labels)
		{
			var places = mapviewer.getAllPlaces();
			for (var placename in places)
			{
				mapviewer.setPlaceName(placename, placename);
			}
		}
		fill_comboboxes();
	}
}

function createFloorLabel(target_floor)
{
		var floor_button_id = 'floor_link'+target_floor;

		//var html = '<a href="#" class="change_floor" data-floor="'+target_floor+'" id="'+floor_button_id+'">Floor '+target_floor+'</a> ';
		var html = '<button class="vg_button change_floor" type="button" data-floor="'+target_floor+'" id="'+floor_button_id+'">'+target_floor+'</button> ';
		jQuery('#change_floor').append(html);
		floor_button_ids['floor'+target_floor] = '#'+floor_button_id;
}

function updateActiveFloorLabel(target_floor)
{
	for (var i in floor_button_ids)
	{
		jQuery(floor_button_ids[i]).removeClass('selected');
	}
	jQuery(floor_button_ids['floor'+target_floor]).addClass('selected');
}

jQuery(document).ready(function()
{
	jQuery('.combobox').combobox();

	// prepare progress bar
	if (supportsDefineProperty && jQuery().knob !== undefined)
	{
		jQuery('.knob').knob();
	}

	var map = mapURL;
	var query = jQuery.deparam.querystring();
	console.log(query);
	if (query.bundle)
	{
		console.log('bundle');
		map =  '../data.bundles/'+query.bundle+'/map.svg';
	}
	else if (query.url)
	{
		console.log('url');
		map = query.url;
		map = map.replace('https:', '');
		map = map.replace('http:', '');
	}

	// Allows to pass labelsURL as a URL parameter &ids=/../ids.json for testing.
	if (query.ids)
	{
		labelsURL = query.ids;
	}

	if (typeof(query.nolabels) != 'undefined')
	{
		need_labels = false;
	}
	if (typeof(query.nomouseover) != 'undefined')
	{
		need_mouseover = false;
	}
	if (typeof(query.noclick) != 'undefined')
	{
		need_click = false;
	}
	if (typeof(query.nolist) != 'undefined')
	{
		fill_list = false;
	}

	if (typeof(query.initialfloor) != 'undefined')
	{
		initialFloorName = query.initialfloor;
	}

	var mapviewer_parameters = {
		path: map,
		initialFloorName: initialFloorName
	}

	// the VisioWeb mapviewer will have higher performance without being able to detect click on a shop.
	if (need_click)
	{
		mapviewer_parameters.onObjectMouseUp = onObjectMouseUp;
	}

	// the VisioWeb mapviewer will have higher performance without mouseover
	if (need_mouseover)
	{
		mapviewer_parameters.onObjectMouseOver = onObjectMouseOver;
		mapviewer_parameters.onObjectMouseOut = onObjectMouseOut;
	}
	// enableObjectMouseOver/Out depends if device has touch support or not.  If we want to force it, set their values to true.
	if (force_mouseover)
	{
		mapviewer_parameters.enableObjectMouseOver = true;
		mapviewer_parameters.enableObjectMouseOut = true;
	}

	// VisioWeb has two strategies for displaying labels with setPlaceName
	// On browsers with CSS pointerevents they will be centered
	if (typeof(query.pointerevents) != 'undefined')
	{
		if (query.pointerevents == '1')
		{
			mapviewer_parameters.forceHasPointerEvents = true;
		}
		else
		{
			// Lets you simulate on Chrome and modern browsers how the label would look
			// and how the mouse over/out/up react on browsers without CSS pointer events like IE8,IE9,IE10
			mapviewer_parameters.forceHasPointerEvents = false;
		}
	}


	if (typeof(vg) == 'undefined')
	{
		console.log("ERROR: Missing Visioglobe SDK...probably missing script file vg.mapviewer.web.js or it is not loaded here");
	}
	mapviewer = new vg.mapviewer.Mapviewer();

	// Note the container to mapviewer.initialize must already be part of the DOM (ie. attached)
	mapviewer.initialize(jQuery('#container')[0], mapviewer_parameters)
	.done(onLoadCompleted)
	.fail(function(result)
	{
		var message = 'Unknown map initialize error';
		if (typeof(result)!=='undefined' && typeof(result.message)!=='undefined')
		{
			message = 'Map initialize error: ' + result.message;
		}
		alert(message);
	}) // chaining
	.progress(function(percentage)
	{
		jQuery('#progress').show();
		var percent_text = (percentage * 100).toFixed(2);
		jQuery('#progress input.knob').val(percent_text).trigger('change');
	});/**/

});