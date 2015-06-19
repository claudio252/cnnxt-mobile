/**
 * @fileOverview
 * Contains an application level helper class for displaying navigation instructions.
 * It is furnished as an example, and can be customized or used as a starting point by the developer.
 */
// for documentation guidelines: http://code.google.com/p/jsdoc-toolkit/w/list
// validate:
// @param {type} easyName Description for all parameters
//  [ ] for optional parameters.
// @private for private members
/** @global */
var instructions_overlay_visible = false;

function updateToggleInstructions() {
  //var nextState = (instructions_overlay_visible == true)?'ON':'OFF';
  //jQuery('#toggle_instructions').html('<a href="#" class="toggle_instructions" >Instructions: '+ nextState+'</a> ');
  if (instructions_overlay_visible) {
    jQuery('#toggle_instructions').attr('checked', 'checked');
    jQuery('#instructions').animate({
      bottom: '0px'
    });
  } else {
    jQuery('#toggle_instructions').removeAttr('checked');
    jQuery('#instructions').animate({
      bottom: '-72px'
    });
  }
  //jQuery('#instructions').css('visibility',instructions_overlay_visible ? 'visible': 'hidden');
}
/**
 * @public
 * @name MyNavigation
 * @class Navigation Example class.
 * It allows the rendering of navigation instructions if available from computeRoute().
 * Creates a navigation object to simplify the display of instructions.
 * It uses for the media directory the value of vg.imagePath (by default "../media"), which contains:
 * <ul>
 * <li>images for transit instructions: transit_*.png
 * </ul>
 * @see vg.mapviewer.kiosk.Mapviewer#computeRoute
 * @see vg.mapviewer.web.Mapviewer#computeRoute
 * @param {vg.mapviewer.Mapviewer} pMapViewer
 * @param {object} pNavigationData, result of vg.mapviewer.Mapviewer.computeRoute()
 * @param {object} vg_ids, place id name correspondance, using the same file format as ids.json: {"targets":["default"],"labels":{"UL0-ID0003":["UL0-ID0003","Zara"],...} }
 *
 * @example
 <code>
 This class asummes that the following elements exist on your .html file

&lt;div id="instructions" class="instructions"&gt;
	&lt;div id="instructions_prev_button" class="instructions"&gt;&lt;img src="media/leftArrow.png"/&gt;&lt;/div&gt;
	&lt;div id="instructions_count" class="instructions"&gt;&lt;/div&gt;
	&lt;div id="instructions_brief" class="instructions"&gt;&lt;/div&gt;
	&lt;div id="instructions_detail" class="instructions"&gt;&lt;/div&gt;
	&lt;img id="instructions_icon" class="instructions"&gt;&lt;/img&gt;
	&lt;div id="instructions_time" class="instructions"&gt;&lt;/div&gt;
	&lt;div id="instructions_next_button" class="instructions"&gt;&lt;img src="media/rightArrow.png"/&gt;&lt;/div&gt;
&lt;/div&gt;
</code>
 *
 * @example
<code>
pNavigationData will have the form

{ "navigation": {
 "instructions" : [{
	"icon": "transit_instruction_turn_left.png",
	"dataset": "0",
	"modality": "pedestrian",
	"time": "0.000000",
	"totalTime": "45.953415","position" : { "lat" : "48.782332", "lon" : "2.221195" },
	"detail": "Go straight for a few seconds then turn left",
	"brief": "Go straight",
	"duration": " for a few seconds"
  }
  ,...
  ]
}
</code>

*/
var MyNavigation = function(pMapViewer, pNavigationData, vg_ids) {
  // For Debugging.
  window.navigationData = pNavigationData;
  var imagePath = vg.imagePath || '../media';
  var mValid = false;
  var instructions;
  var mapviewer = pMapViewer;
  // start by saying no instruction has been set
  var currentInstructionIndex = 0;
  var numberOfInstructions;
  var instructionOverlays = [];
  // If you want to highlight the curent instruction for debugging.
  // NOTE in VisioKiosk displaying two overlapping routing segments is not supported.
  var debugInstructionSegments = false;
  var _this = this;
  /**
   * @public
   * @name isValid
   * @function
   * @memberOf MyNavigation#
   * @description
   * returns false if there was no navigation data (for example missing "computeNavigation: true" in the routing request)
   * @return {boolean} false if there was no navigation data
   */
  this.isValid = function() {
    return mValid;
  }
  /**
   * @public
   * @name navigationInstructionRadius
   * @type number
   * @field
   * @memberOf MyNavigation
   * @description radius in meters to use when moving the camera to the beginning of an instruction.
   */
  this.navigationInstructionRadius = 50;
  /**
   * @public
   * @name displayNextInstruction
   * @function
   * @memberOf MyNavigation#
   * @description
   * displays the previous instruction if possible and move the camera to the start of the instruction
   */
  this.displayNextInstruction = function() {
    if (currentInstructionIndex < (numberOfInstructions - 1)) {
      currentInstructionIndex++;
      displayInstruction(currentInstructionIndex);
      goToCurrentInstruction();
    }
  }
  /**
   * @public
   * @name displayPrevInstruction
   * @function
   * @memberOf MyNavigation#
   * @description
   * displays the previous instruction if possible and move the camera to the start of the instruction
   */
  this.displayPrevInstruction = function() {
    if (currentInstructionIndex > 0) {
      currentInstructionIndex--;
      displayInstruction(currentInstructionIndex);
      goToCurrentInstruction();
    }
  }
  /**
   * @public
   * @name remove
   * @function
   * @memberOf MyNavigation#
   * @description
   * clear all information associated with the navigation.
   */
  this.remove = function() {
    currentInstructionIndex = 0;
    numberOfInstructions = 0;
    jQuery('#instructions_detail').html('');
    jQuery('#instructions_brief').html('');
    //jQuery('#instructions_count').html('0/0');
    jQuery('#instructions_count').html('');
    jQuery('#instructions_time').html('');
    jQuery('#instructions_icon').attr("src", '');
    this.removeInstructionOverlays();
  }
  /**
   * @public
   * @name removeInstructionOverlays
   * @function
   * @memberOf MyNavigation#
   * @description
   * clear any instruction extra overlays.
   */
  this.removeInstructionOverlays = function() {
    for (i in instructionOverlays) {
      instructionOverlays[i].remove();
    }
    instructionOverlays = [];
  }
  /**
   * @private
   * calls mapviewer.camera.goTo(), if necessary it calls mapviewer.changeFloor()
   * Assumes global function updateActiveFloorLabel() is available.
   */
  function goToCurrentInstruction() {
    if (currentInstructionIndex == -1) {
      currentInstructionIndex = 0;
    }
    var instruction = instructions[currentInstructionIndex];
    // available on SDKs and datasets with offline routing
    var position;
    var seeWholeInstruction = false;
    if (seeWholeInstruction && instruction.positions && instruction.positions.length > 0) {
      var points = instruction.positions;
      var converted_points = [];
      for (var j = 0, jl = points.length; j < jl; j++) {
        var point = points[j];
        // transfor to new coordinates
        point = mapviewer.convertLatLonToPoint(point);
        converted_points.push(point);
      }
      position = mapviewer.getViewpointFromPositions({
        points: converted_points,
        top: 50,
        bottom: 50,
        left: 50,
        right: 50
      });
      //position.radius = Math.max(position.radius,_this.navigationInstructionRadius);
    } else {
      // If you want to keep same height as currently for instructions.
      //_this.navigationInstructionRadius = mapviewer.camera.position.radius;
      position = mapviewer.convertLatLonToPoint(instruction['position']);
      position.radius = _this.navigationInstructionRadius;
    }

    //TODO: CHECK IF THIS IS CORRECT
    position.radius = mapviewer.camera.minRadius;

    var currentFloor = mapviewer.getCurrentFloor();
    var instructionFloor = instruction['dataset'];
    if (currentFloor != instructionFloor) {
      mapviewer.changeFloor(instructionFloor).done(function() {
        mapviewer.camera.goTo(position);
        // Assumes global function updateActiveFloorLabel() is available.
        if (typeof(updateActiveFloorLabel) == 'function') {
          updateActiveFloorLabel(instructionFloor);
        }
      });
    } else {
      mapviewer.camera.goTo(position);
    }
  }
  /**
   * @private
   * updates navigation div's with a given navigation instruction
   * @param {number} instruction index
   * @since 1.7.10 handle .duration and .durationString, does not update currentInstructionIndex
   */
  function displayInstruction(index) {
    var instruction = instructions[index];
    /* It relies at least on the following images
			transit_instruction_end.png
			transit_instruction_stairs_down.png
			transit_instruction_stairs_up.png
			transit_instruction_start.png
			transit_instruction_straight.png
			transit_instruction_turn_gentle_left.png
			transit_instruction_turn_gentle_right.png
			transit_instruction_turn_left.png
			transit_instruction_turn_right.png
			transit_instruction_turn_sharp_left.png
			transit_instruction_turn_sharp_right.png
			transit_instruction_uturn_left.png
			transit_instruction_uturn_right.png
			*/
    if (instruction !== undefined) {
      jQuery('#instructions_detail').html(instruction['detail']);
      jQuery('#instructions_brief').html(instruction['brief']);
      jQuery('#instructions_count').html((index + 1) + '/' + numberOfInstructions);
      // since 1.7.10, if the instructions comes from javascript engine,
      // instruction.duration contains the duration in seconds, and durationString contains
      // for example 'in few minutes'
      // If the data comes from routing server, .duration will be the duration string.
      var durationString = (typeof(instruction['durationString']) !== 'undefined') ? instruction['durationString'] : instruction['duration'];
      jQuery('#instructions_time').html(durationString);
      jQuery('#instructions_icon').attr("src", imagePath + '/' + instruction['icon']);
    }
    // Configure how the line looks
    _this.removeInstructionOverlays();
    if (debugInstructionSegments && typeof(instruction.positions) !== 'undefined') {
      var overlayPoints = [];
      for (var j = 0, jl = instruction.positions.length; j < jl; j++) {
        var point = instruction.positions[j];
        // transfor to new coordinates
        point = mapviewer.convertLatLonToPoint(point);
        point.z = 2.5;
        overlayPoints.push(point);
      }
      var path_options = {
        floor: instruction.dataset,
        //url: trackImage, // only available on vg.mapviewer.kiosk.Mapviewer
        //speed: lSpeed, // only available on vg.mapviewer.kiosk.Mapviewer
        repeat: -1, // only available on vg.mapviewer.kiosk.Mapviewer
        thickness: 3.0,
        color: 0x00ff00, // change the color of the line
        points: overlayPoints,
        // only available on vg.mapviewer.kiosk.Mapviewer, this makes it looks
        // better for sharp turns. Negative values will try to adapt the number of
        // segments to the length of the route, such that the absolute value
        // indicates the number of segments per "??unit??"
        segments: 1000
      };
      //
      instructionOverlays.push(mapviewer.addRoutingPath(path_options));
    }
  }
  var navigation = pNavigationData['navigation'];
  if (navigation !== undefined) {
    instructions = navigation['instructions'];
    if (jQuery.isArray(instructions)) {
      numberOfInstructions = instructions.length;
      if (numberOfInstructions > 0) {
        // Translate instructions if they come from offline routing
        // i.e. they don't have a member .brief for example.
        // If they come from the Routing Server (network), then do not translate
        if (typeof(instructions[0].brief) === 'undefined') {
          var translator = new MyNavigationTranslator();
          var languageString = "en"; // "fr"
          translator.translateInstructions(instructions, languageString);
        }
        displayInstruction(0);
      }
      mValid = true;
    }
  } else {
    this.remove();
  }
};
// This code comes from VisioMove SDK: VgMyNavigationHelper.cpp
/**
 * @public
 * @name MyNavigationTranslator
 * @class Navigation Translator class used to translate navigation instructions coming from
 * the off-line routing engine (needs version 1.7.10 or greater)
 * Takes an instruction array and augments it with plain language descriptions.
 *
 * @see vg.mapviewer.kiosk.Mapviewer#computeRoute
 * @see vg.mapviewer.web.Mapviewer#computeRoute
 * @see MyNavigationTranslator#translateInstructions
 *
 * @example
var translator = new MyNavigationTranslator();
var languageString = "en"; // "fr"
translator.translateInstructions(routeResultData.navigation.instructions, languageString);
*
* @since 1.7.10
*/
var MyNavigationTranslator = function() {};
/**
 * @private
 * @name cLanguageMap
 * @memberOf MyNavigationTranslator#
 * @description
 * Map of language strings to index into: cActionStringTable, cNextActionStringTable, cTimeStringTable, cStringTable.
 * These tables keep exactly the same structure as the VisioMove SDK.
 */
MyNavigationTranslator.prototype.cLanguageMap = {
  "en": 0,
  "fr": 1
};
// You can use a table like this to handle multiple languages.
// This text is in UTF8
/**
 * @private
 * @name cActionStringTable
 * @memberOf MyNavigationTranslator#
 * @description
 * Maneuver to action string including tokens to be replaced by certain keywords
 * @see MyNavigationTranslator#_replaceTokens
 */
MyNavigationTranslator.prototype.cActionStringTable = [
  ["<unknown>", // eVgManeuverTypeUnknown
    "Go straight", "Turn gentle right", "Turn gentle left", "Turn right", "Turn left", "Turn sharp right", "Turn sharp left", "Make right U-turn", "Make left U-turn", "Start", "You have arrived", "Go up to floor %L", "Go down to floor %L", "Use transportation mode %M", "Change Buildings",
  ],
  ["<inconnu>", // eVgManeuverTypeUnknown
    "Continuez tout droit", "Tournez légèrement à droite", "Tournez légèrement à gauche", "Tournez à droite", "Tournez à gauche", "Tournez fortement à droite", "Tournez fortement à gauche", "Effectuez un demi-tour à droite", "Effectuez un demi-tour à gauche", "Départ", "Arrivée", "Montez à l'étage %L", "Descendez à l'étage %L", "Changez de moyen de transport: %M", "Changez de bâtiment",
  ],
];
/**
 * @private
 * @name cNextActionStringTable
 * @memberOf MyNavigationTranslator#
 * @description
 * Maneuver to next action string including tokens to be replaced by certain keywords
 * @see MyNavigationTranslator#_replaceTokens
 */
MyNavigationTranslator.prototype.cNextActionStringTable = [
  ["<unknown>", // eVgManeuverTypeUnknown
    "go straight", "turn gentle right", "turn gentle left", "turn right", "turn left", "turn sharp right", "turn sharp left", "make right U-turn", "make left U-turn", "start", "you have arrived", "go up", "go down", "change transportation mode: %M", "change buildings", // Layer change, it could be buildings, zone, inside/outside....
  ],
  ["<inconnu>", // eVgManeuverTypeUnknown
    "continuez tout droit", "tournez légèrement à droite", "tournez légèrement à gauche", "tournez à droite", "tournez à gauche", "tournez fortement à droite", "tournez fortement à gauche", "effectuez un demi-tour à droite", "effectuez un demi-tour à gauche", "départ", "vous serez arrivés", "montez", "descendez", "changez de mode de transport: %M", "changez de bâtiment",
  ]
];
/**
 * @private
 * @name cTimeStringTable
 * @memberOf MyNavigationTranslator#
 * @description
 * time under minute, around a minute, X number of minutes
 * @see MyNavigationTranslator#_replaceTokens
 */
MyNavigationTranslator.prototype.cTimeStringTable = [
  ["a few seconds", "about a minute", "about %d minutes", ],
  ["quelques secondes", "environ une minute", "environ %d minutes", ]
];
/*[cNumLanguages][eStringCount]*/
/**
 * @private
 * @name cStringTable
 * @memberOf MyNavigationTranslator#
 * @description
 * translation of some keywords
 */
MyNavigationTranslator.prototype.cStringTable = [
  [" for ", " then ", " and ", " near ", " using ", ],
  [" pendant ", " puis ", " et ", " à proximité de ", " en empruntant ", ]
];
// Format
//	en: {action}[{duration}][{nextAction}[{means}]].
//	fr: {action}[{duration}][{nextAction}[{means}]].
//
// action:
//	en: "Change transportation mode"    | "Go up"  | "Go down"   | "Go straight"
//	fr: "Changez de moyen de transport" | "Montez" | "Descendez" | "Continuez"
//
// duration:
//	en: " for a few seconds"     | " for about a minute"     | " for about {dur} minutes" | ""
//	fr: " pendant quelques secondes" | " pendant environ une minute" | " pendant environ {dur} minutes"
//
// nextAction:
//	en: " then change transportation mode"    | " go up"  | " go down"   | " go straight"
//	fr: " puis changez de moyen de transport" | " montez" | " descendez" | " continuez"
//
// means:
//	en: " using {placeName}"         | " near {placeName}"
//	fr: " en empruntant {placeName}" | " à proximité de {placeName}"
/**
 * @private
 * @name cManeuverType2Index
 * @memberOf MyNavigationTranslator#
 * @description
 * conversion from maneuver string to index.
 */
MyNavigationTranslator.prototype.cManeuverType2Index = {
  'eVgManeuverTypeUnknown': 0,
  'eVgManeuverTypeGoStraight': 1,
  'eVgManeuverTypeTurnGentleRight': 2,
  'eVgManeuverTypeTurnGentleLeft': 3,
  'eVgManeuverTypeTurnRight': 4,
  'eVgManeuverTypeTurnLeft': 5,
  'eVgManeuverTypeTurnSharpRight': 6,
  'eVgManeuverTypeTurnSharpLeft': 7,
  'eVgManeuverTypeUTurnRight': 8,
  'eVgManeuverTypeUTurnLeft': 9,
  'eVgManeuverTypeStart': 10,
  'eVgManeuverTypeEnd': 11,
  'eVgManeuverTypeGoUp': 12,
  'eVgManeuverTypeGoDown': 13,
  'eVgManeuverTypeChangeModality': 14,
  'eVgManeuverTypeChangeLayer': 15
};
/**
 * @public
 * @name translateInstructions
 * @function
 * @memberOf MyNavigationTranslator#
 *
 * @param {Array} pInstructions array of instructions
 * @param {String} [pLanguageString="en"] language string like "en" or "fr", must be in cLanguageMap, defaults to "en" if not found.
 * @description
 * translates all the instructions in pInstructions, augmenting each instruction with .brief, .detailed, .duration, .durationInSeconds
 */
MyNavigationTranslator.prototype.translateInstructions = function(pInstructions, pLanguageString) {
  // setup language
  var languageID = (pLanguageString && this.cLanguageMap[pLanguageString]) || this.cLanguageMap["en"];
  var _this = this;
  // this comes from this.navigationParameters && this.navigationParameters.mMergeFloorChangeInstructions;
  // But not fully implemented
  var mergeFloorChangeInstructions = false;
  for (var index = 0, l = pInstructions.length; index < l; index++) {
    _this._translateInstruction(pInstructions, index, languageID, mergeFloorChangeInstructions);
  }
}
/*
* Input:
maneuverType
dataset
modality
height
duration: in seconds
*/
/**
 * @private
 * @name _translateInstructions
 * @function
 * @memberOf MyNavigationTranslator#
 *
 * @param {Array} pInstructions array of instructions
 * @param {number} pIndex index of instruction to translate
 * @param {number} [pLanguageIndex=0] language index in cLanguageMap.
 * @param {boolean} [pMergeFloorInstructions=false] if mergeFloorInstructions flag was used when computing the instructions, by default false
 * @description
 * translates all the instructions in pInstructions, augmenting each instruction with .brief, .detailed, .duration, .durationInSeconds
 */
MyNavigationTranslator.prototype._translateInstruction = function(pInstructions, pIndex, pLanguageIndex, pMergeFloorInstructions) {
  // default to 0
  pLang = pLanguageIndex || 0;
  // default pMergeFloorInstructions to false
  pMergeFloorInstructions = pMergeFloorInstructions || false;
  var lNumInstructions = pInstructions.length;
  var lInstruction = pInstructions[pIndex];
  var lNextInstruction = pInstructions[pIndex + 1];
  var lInstructionManeuverIndex = this.cManeuverType2Index[lInstruction.maneuverType];
  var lStringAction = '';
  var lStringDuration = '';
  var lStringNextAction = '';
  var lStringVincinity = '';
  //enum StringType
  /** Duration link word ("for" in English, "pendant" in French) */
  var eStringFor = 0;
  /** Duration link word ("then" in English, "puis" in French) */
  var eStringThen = 1;
  /** Duration link word ("and" in English, "et" in French) */
  var eStringAnd = 2;
  /** Duration link word ("near" in English, "‡ proximitÈ de" in French) */
  var eStringNear = 3;
  /** Duration link word ("using" in English, "en empruntant" in French) */
  var eStringUsing = 4;
  /** Last entry does not identify a string it is the number of strings */
  var eStringCount = 5;
  var eVgManeuverTypeUnknown = 0;
  var eVgManeuverTypeGoStraight = 1;
  var eVgManeuverTypeTurnGentleRight = 2;
  var eVgManeuverTypeTurnGentleLeft = 3;
  var eVgManeuverTypeTurnRight = 4;
  var eVgManeuverTypeTurnLeft = 5;
  var eVgManeuverTypeTurnSharpRight = 6;
  var eVgManeuverTypeTurnSharpLeft = 7;
  var eVgManeuverTypeUTurnRight = 8;
  var eVgManeuverTypeUTurnLeft = 9;
  var eVgManeuverTypeStart = 10;
  var eVgManeuverTypeEnd = 11;
  var eVgManeuverTypeGoUp = 12;
  var eVgManeuverTypeGoDown = 13;
  var eVgManeuverTypeChangeModality = 14;
  var eVgManeuverTypeChangeLayer = 15;
  var eVgManeuverTypeMax = 16;
  switch (lInstruction.maneuverType) {
    case 'eVgManeuverTypeChangeModality':
    case 'eVgManeuverTypeChangeLayer':
    case 'eVgManeuverTypeEnd':
    case 'eVgManeuverTypeGoDown':
    case 'eVgManeuverTypeGoUp':
    case 'eVgManeuverTypeStart':
      lStringAction = this.cActionStringTable[pLang][lInstructionManeuverIndex];
      break;
    case 'eVgManeuverTypeGoStraight':
      lStringAction = this.cActionStringTable[pLang][eVgManeuverTypeGoStraight];
      lStringDuration = this.cStringTable[pLang][eStringFor] + this._timeToText(lInstruction.duration / 60.0, pLang);
      if (pMergeFloorInstructions) {
        // When instruction merging is active, we have to test the next
        // instruction's layer/modality to know if we should instruct to change
        // level/transportation.
        if (!lNextInstruction) {
          // Last instruction means next action is "you have arrived"
          lStringNextAction = this.cStringTable[pLang][eStringThen] + this.cNextActionStringTable[pLang][eVgManeuverTypeEnd];
          break;
        }
        var lInstructionLayer = lInstruction.dataset;
        var lNextInstructionLayer = lNextInstruction && lNextInstruction.dataset;
        if (lInstructionLayer != lNextInstructionLayer) {
          // Test whether we go up or down or is a change of layers (possibly building)
          if (lNextInstruction.height > lInstruction.height) {
            lStringNextAction = this.cStringTable[pLang][eStringThen] + this.cNextActionStringTable[pLang][eVgManeuverTypeGoUp];
          } else if (lNextInstruction.height < lInstruction.height) {
            lStringNextAction = this.cStringTable[pLang][eStringThen] + this.cNextActionStringTable[pLang][eVgManeuverTypeGoDown];
          } else {
            // then is a change of layer (building)
            lStringNextAction = cStringTable[pLang][eStringThen] + cNextActionStringTable[pLang][eVgManeuverTypeChangeLayer];
          }
          if (lNextInstruction.modality != lInstruction.modality) {
            // This works here because with mMergeFloorChangeInstructions
            // The next instruction will have the right modality
            lStringNextAction += this.cStringTable[pLang][eStringAnd] + this.cNextActionStringTable[pLang][eVgManeuverTypeChangeModality];
          }
        } else if (lNextInstruction.modality != lInstruction.modality) {
          lStringNextAction += this.cStringTable[pLang][eStringThen] + this.cNextActionStringTable[pLang][eVgManeuverTypeChangeModality];
        }
      } else {
        // When instruction merging is inactive, we have to test the next
        // instruction's type to know if we should instruct to change level
        // or transportation mode.
        if (pIndex < lNumInstructions - 1) {
          {
            switch (lNextInstruction.maneuverType) {
              case 'eVgManeuverTypeChangeLayer':
                // We skip the change modality, as the modality of the
                // instruction of eVgManeuverTypeChangeModality
                // is the same as the current modality, thus the text
                // will be wrong (#6684)
                //
                //case VgNavigationModule::eVgManeuverTypeChangeModality:
              case 'eVgManeuverTypeEnd':
              case 'eVgManeuverTypeGoDown':
              case 'eVgManeuverTypeGoUp':
                lStringNextAction = this.cStringTable[pLang][eStringThen] + this.cNextActionStringTable[pLang][this.cManeuverType2Index[lNextInstruction.maneuverType]];
                break;
              default:
                break;
            }
          }
        } else {
          // We are on last instruction, so no next action.
        }
      }
      break;
    default:
      // These are turn left/right instructions
      lStringAction = this.cActionStringTable[pLang][eVgManeuverTypeGoStraight];
      lStringDuration = this.cStringTable[pLang][eStringFor] + this._timeToText(lInstruction.duration / 60.0, pLang);
      lStringNextAction = this.cStringTable[pLang][eStringThen] + this.cNextActionStringTable[pLang][this.cManeuverType2Index[lInstruction.maneuverType]];
      break;
  } // switch statement
  var lSkipNearPlaces = false;
  var lPlaces = lInstruction.nearPlaces;
  if ((pMergeFloorInstructions && pIndex >= (lNumInstructions - 1)) || (!pMergeFloorInstructions && pIndex >= (lNumInstructions - 2))) {
    lSkipNearPlaces = true;
  }
  var lThereIsFloorChange = false;
  // If current instruction if a change floor kind OR
  // without mergefloor the next instruction is the change floor kind OR
  // with mergefloor, the height of the current and next instruction are different
  if ((lInstruction.maneuverType == 'eVgManeuverTypeGoUp' || lInstruction.maneuverType == 'eVgManeuverTypeGoDown') || (!pMergeFloorInstructions && pIndex < (lNumInstructions - 2) && (pInstructions[pIndex + 1].maneuverType == 'eVgManeuverTypeGoUp' || pInstructions[pIndex + 1].maneuverType == 'eVgManeuverTypeGoDown')) || (pMergeFloorInstructions && pIndex < (lNumInstructions - 1) && lInstruction.height != pInstructions[pIndex + 1].height)) {
    lThereIsFloorChange = true;
  }
  if (!lSkipNearPlaces) {
    if (lPlaces && lPlaces.length > 0) {
      // TODO get place name
      var lID = lPlaces[0].id;
      var lPlaceName = (typeof(vg_ids) !== 'undefined') && vg_ids.labels && vg_ids.labels[lID] && vg_ids.labels[lID].length > 1 && vg_ids.labels[lID][1];
      // For debugging, put ID if placename is not found.
      lPlaceName = lPlaceName || lID;
      if (lPlaceName && lPlaceName != '' && lInstruction.maneuverType != 'eVgManeuverTypeChangeModality' && lInstruction.maneuverType != 'eVgManeuverTypeChangeLayer' && lInstruction.maneuverType != 'eVgManeuverTypeEnd') {
        if (lThereIsFloorChange) {
          // If there is a floor change we try to find the name of the escalator
          // or lift
          if (lPlaceName.match(/escalator/i) || lPlaceName.match(/elevator/i) || lPlaceName.match(/lift/i) || lPlaceName.match(/stair/i)) {
            // we say using, if the near POI is a [E]scalator or [E]levator.
            // else we say nothing.
            lStringVincinity = this.cStringTable[pLang][eStringUsing] + lPlaceName;
          }
        } else {
          lStringVincinity = this.cStringTable[pLang][eStringNear] + lPlaceName;
        }
      }
    }
  }
  // Uncomment this line if you don't want landmark navigation.
  // lStringVincinity = '';
  lInstruction.detail = lStringAction + lStringDuration + lStringNextAction;
  if ((lStringNextAction && lStringNextAction != '') || lInstruction.maneuverType == 'eVgManeuverTypeGoUp' || lInstruction.maneuverType == 'eVgManeuverTypeGoDown') {
    lInstruction.detail += lStringVincinity;
  }
  lInstruction.brief = lStringAction;
  lInstruction.durationString = lStringDuration;
  lInstruction.detail = this._replaceTokens(lInstruction.detail, lInstruction, lNextInstruction);
  lInstruction.brief = this._replaceTokens(lInstruction.brief, lInstruction, lNextInstruction);
  lInstruction.durationString = this._replaceTokens(lInstruction.durationString, lInstruction, lNextInstruction);
} // end NavigationSolver.prototype.translateInstruction
/**
 * @private
 * @name _replaceTokens
 * @memberOf MyNavigationTranslator#
 * @function
 * @description
 * replaces tokens on a string. %d: duration in minutes, %m: current modality, %l: current dataset
 * %M modality of next instruction, %L: next dataset name.
 * @param {String} string with tokens
 * @param {InstructionObject} pInstructionCurrent
 * @param {InstructionObject} pInstructionNext
 * @return string with tokens replaced
 */
MyNavigationTranslator.prototype._replaceTokens = function(pStringWithTokens, pInstructionCurrent, pInstructionNext) {
  // Replaces occurrances of a token with contextual data
  if (typeof(pInstructionCurrent) !== 'undefined') {
    var lDurationInMinutes = Math.floor(pInstructionCurrent.duration / 60.0);
    pStringWithTokens = pStringWithTokens.replace('%d', lDurationInMinutes);
    pStringWithTokens = pStringWithTokens.replace('%m', pInstructionCurrent.modality);
    pStringWithTokens = pStringWithTokens.replace('%l', pInstructionCurrent.dataset);
  }
  if (typeof(pInstructionNext) !== 'undefined') {
    pStringWithTokens = pStringWithTokens.replace('%M', pInstructionNext.modality);
    pStringWithTokens = pStringWithTokens.replace('%L', pInstructionNext.dataset);
  }
  return pStringWithTokens;
}
/**
 * @private
 * @name _timeToText
 * @function
 * @memberOf MyNavigationTranslator#
 * @description
 * converts time in minutes to a string in a language
 * @param {number} pTimeInMinutes
 * @param {number} pLang
 * @return string describing duration
 */
MyNavigationTranslator.prototype._timeToText = function(pTimeInMinutes, pLang) {
  if (pTimeInMinutes < 1.0) {
    return this.cTimeStringTable[pLang][0];
  } else if (pTimeInMinutes < 2.0) {
    return this.cTimeStringTable[pLang][1];
  } else {
    return this.cTimeStringTable[pLang][2];
  }
}