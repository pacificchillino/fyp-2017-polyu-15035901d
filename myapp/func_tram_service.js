var config = require("./config.js");

/**
 * Tram Section List:
 * global.tramSectionsList[i].from
 * global.tramSectionsList[i].to
 * global.tramSectionsList[i].from_to
 * global.tramSectionsList[i].from_name
 * global.tramSectionsList[i].to_name
 * global.tramSectionsList[i].caption
 */

//Initialize
if (global.tramSectionsList == null){
	var arr = [];
	for (var i in config.tram_est_sections){
		var _obj = config.tram_est_sections[i];
		var from = (_obj.from_alt != null) ? _obj.from_alt : _obj.from;
		var to = (_obj.to_alt != null) ? _obj.to_alt : _obj.to;
		arr.push({
			from: from,
			to: to,
			from_to: from + "/" + to,
			from_name: config.tram_stops_for_eta[config.tram_est_sections[i].from].name,
			to_name: config.tram_stops_for_eta[config.tram_est_sections[i].to].name,
			caption: from + " to " + to + " (" + config.tram_stops_for_eta[config.tram_est_sections[i].from].name + " to " + config.tram_stops_for_eta[config.tram_est_sections[i].to].name + ")",
		});
	}
	global.tramSectionsList = arr;
}

/**
 * Tram Prediction Service From-Tos:
 * global.tramPredictionServiceFromTo[from].name
 * global.tramPredictionServiceFromTo[from].direction
 * global.tramPredictionServiceFromTo[from].to[to].name
 * global.tramPredictionServiceFromTo[from].to[to].direction
 * global.tramPredictionServiceFromTo[from].to[to]["0"] --> List of sections
 * global.tramPredictionServiceFromTo[from].to[to]["1"] --> List of sections
 */

//Initialize
if (global.tramPredictionServiceFromTo == null){
	global.tramPredictionServiceFromTo = {};
	//Function to add item to array
	var addToList = function(viaStops){
		//Obtain section
		var stopA = viaStops[0];
		var stopB = viaStops[viaStops.length - 1];
		var isMulti = (viaStops.length == 2) ? 0 : 1;
		//Get Name & Direction of stop A
		var stopNameA = config.tram_stops_for_eta[stopA].name;
		var stopNameB = config.tram_stops_for_eta[stopB].name;
		var directionA = config.tram_stops_for_eta[stopA].direction;
		var directionB = config.tram_stops_for_eta[stopB].direction;
		//Add to array
		if (global.tramPredictionServiceFromTo[stopA] == null){
			global.tramPredictionServiceFromTo[stopA] = {
				name: stopNameA,
				direction: directionA,
				to: {},
			};
		}
		if (global.tramPredictionServiceFromTo[stopA].to[stopB] == null){
			global.tramPredictionServiceFromTo[stopA].to[stopB] = {
				name: stopNameB,
				direction: directionB,
			};
		}
		if (global.tramPredictionServiceFromTo[stopA].to[stopB][isMulti] == null){
			global.tramPredictionServiceFromTo[stopA].to[stopB][isMulti] = viaStops;
		}
	};
	//Read tram_prediction_from_to
	for (var i in config.tram_prediction_from_to){
		var entry = config.tram_prediction_from_to[i];
		//Type 1: between
		if (entry.between){
			for (var j = 0; j < entry.between.length - 1; j++){
				for (var k = j+1; k < entry.between.length; k++){
					addToList(entry.between.slice(j, k+1));
				}
			}
		}
		//Type 2: from, to
		else{
			for (var j = 0; j < entry.from.length; j++){
				for (var k = 0; k < entry.to.length; k++){
					var arr1 = entry.from.slice(j);
					var arr2 = entry.to.slice(0, k+1);
					addToList(arr1.concat(arr2));
				}
			}
		}
	}
}

/**
 * Tram Prediction Service Menu:
 * global.tramPredictionServiceMenu[from_name]
 * global.tramPredictionServiceMenu[from_name][to_name].from
 * global.tramPredictionServiceMenu[from_name][to_name].to
 * global.tramPredictionServiceMenu[from_name][to_name]["1"] --> true / false
 * global.tramPredictionServiceMenu[from_name][to_name]["0"] --> true / false
 * global.tramPredictionServiceMenu_fromList --> Array of from_names
 */

//Initialize
if (global.tramPredictionServiceMenu == null){
	global.tramPredictionServiceMenu = {};
	global.tramPredictionServiceMenu_fromList = [];
	//From from-to list
	for (var i in global.tramPredictionServiceFromTo){
		var from_name = global.tramPredictionServiceFromTo[i].name;
		for (var j in global.tramPredictionServiceFromTo[i].to){
			var to_name = global.tramPredictionServiceFromTo[i].to[j].name;
			//Add to tramPredictionServiceMenu
			if (global.tramPredictionServiceMenu[from_name] == null){
				global.tramPredictionServiceMenu[from_name] = {};
			}
			if (global.tramPredictionServiceMenu[from_name][to_name] == null){
				global.tramPredictionServiceMenu[from_name][to_name] = {};
			}
			global.tramPredictionServiceMenu[from_name][to_name].from = i;
			global.tramPredictionServiceMenu[from_name][to_name].to = j;
			global.tramPredictionServiceMenu[from_name][to_name]["1"] = (global.tramPredictionServiceFromTo[i].to[j]["1"] != null);
			global.tramPredictionServiceMenu[from_name][to_name]["0"] = (global.tramPredictionServiceFromTo[i].to[j]["0"] != null);
		}
		//Add to tramPredictionServiceMenu_fromList
		global.tramPredictionServiceMenu_fromList.push(from_name);
	}
}

/**
 * Tram ETA Service Menu:
 * global.tramETAServiceMenu[name][direction] --> code
 */

//Initialize
if (global.tramETAServiceMenu == null){
	global.tramETAServiceMenu = {};
	for (var i in config.tram_est_sections){
		var item = config.tram_est_sections[i];
		if (item.isSpecialSection != true){
			var direction = config.tram_stops_for_eta[item.from].direction;
			var name = config.tram_stops_for_eta[item.from].name;
			if (global.tramETAServiceMenu[name] == null){
				global.tramETAServiceMenu[name] = {};
			}
			if (global.tramETAServiceMenu[name][direction] == null){
				global.tramETAServiceMenu[name][direction] = item.from;
			}
		}
	}
};

/**
 * Other functions
 */

exports.getTramPredictionServiceFromToSections = function(from, to, multi){
	if (global.tramPredictionServiceFromTo[from] == null){
		return [];
	}else if (global.tramPredictionServiceFromTo[from].to[to] == null){
		return [];
	}else if (global.tramPredictionServiceFromTo[from].to[to][multi] == null){
		return [];
	}else{
		return global.tramPredictionServiceFromTo[from].to[to][multi];
	}
};

exports.getRainfallByTramSection = function(stopA, stopB){ //HVT not HVT_B
	//Get rainfall weightings
	var weightings = [];
	for (var i in config.tram_est_sections){
		if (config.tram_est_sections[i].from.split("_")[0] == stopA){
			if (config.tram_est_sections[i].to.split("_")[0] == stopB){
				weightings = config.tram_est_sections[i].rainfall;
			}
		}
	}
	var sum = 0;
	for (var i in weightings){
		if (global.weather.rainfall[weightings[i].district] != null){
			sum += global.weather.rainfall[weightings[i].district] * weightings[i].weight;
		}
	}
	return sum;
};