var config = require("./config.js");
var func = require("./func.js");

exports.name = "Historical Data Based Model";
exports.description = "Simply using average travelling time of the past data.";
exports.modes = {
	"default": {
		name: "Weekday or Not Classification",
		description: "Public holidays are considered as non-weekdays.",
		classification: func.getDayClassByWeekdayOrNot,
		classList: func.dayClassListByWeekdayOrNot,
	},
	"dayofwk": {
		name: "Day of Week Classification",
		description: "Public holidays are considered as public holidays.",
		classification: func.getDayClassByDayOfWeek,
		classList: func.dayClassListByDayOfWeek,
	},
	"noclass": {
		name: "No Classification of Days",
		description: "No Classification",
		classification: function(data){ return "all"; },
		classList: ["all"],
	},
};

/**
 * Variables:
 * - average_tt[sectCollection][mode][class]
 */

var lastUpdate;
var average_tt = new Object();

/**
 * Method for Obtaining Last Update Time
 */

exports.getLastUpdate = function(){
	return lastUpdate;
}

/**
 * Method for Initialization of a Section of Prediction (when server starts or at midnight)
 */

exports.init = function(sectCollection, data){
	lastUpdate = new Date();
	average_tt[sectCollection] = new Object();
	//For each mode
	for (var mode in exports.modes){
		average_tt[sectCollection][mode] = new Object();
		//For each class --> set up sum & count
		for (var i in exports.modes[mode].classList){
			var myClass = exports.modes[mode].classList[i];
			average_tt[sectCollection][mode][myClass] = {sum: 0, count: 0};
		}
		//For each piece of data
		for (var i in data){
			var myClass = exports.modes[mode].classification(data[i]);
			average_tt[sectCollection][mode][myClass].sum += data[i].tt_mins;
			average_tt[sectCollection][mode][myClass].count ++;
		}
		//For each class --> find mean
		for (var i in exports.modes[mode].classList){
			var myClass = exports.modes[mode].classList[i];
			var sc = average_tt[sectCollection][mode][myClass];
			average_tt[sectCollection][mode][myClass] = sc.sum / sc.count;
		}
	}
};

/**
 * Method for Making a Prediction for a Section
 */
exports.predict = function(sectCollection, mode, inputData){
	//Determine the day class
	var myClass = exports.modes[mode].classification(inputData);
	if (average_tt[sectCollection] != null){
		if (average_tt[sectCollection][mode] != null){
			return average_tt[sectCollection][mode][myClass];
		}
	}
	return null;
};