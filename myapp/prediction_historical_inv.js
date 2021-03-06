var config = require("./config.js");
var func = require("./func.js");

exports.name = "Historical Average Model (Inverse)";
exports.description = "Using average travelling speed (i.e. inverse of travelling time) of the past data.";
exports.modes = {
	"default": {
		name: "Weekday or Not Classification",
		description: "Public holidays are considered as non-weekdays.",
		classification: func.getDayClassByWeekdayOrNot,
		classList: func.dayClassListByWeekdayOrNot,
		classDescription: func.dayClassDescriptionByWeekdayOrNot,
	},
	"dayofwk": {
		name: "Day of Week Classification",
		description: "Public holidays are also considered as Sundays.",
		classification: func.getDayClassByDayOfWeek,
		classList: func.dayClassListByDayOfWeek,
		classDescription: func.dayClassDescriptionByDayOfWeek,
	},
	"noclass": {
		name: "No Classification of Days",
		description: "No Classification",
		classification: function(data){ return "uncl"; },
		classList: ["uncl"],
		classDescription: ["Unclassified"],
	},
};

/**
 * Variables:
 * - average_tt[sectCollection][mode][class]
 */

var average_tt = new Object();

/**
 * Method for Initialization of a Section of Prediction (when server starts or at midnight)
 */

exports.init = function(sectCollection, data){
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
			average_tt[sectCollection][mode][myClass].sum += (1 / data[i].tt_mins);
			average_tt[sectCollection][mode][myClass].count ++;
		}
		//For each class --> find mean
		for (var i in exports.modes[mode].classList){
			var myClass = exports.modes[mode].classList[i];
			var sc = average_tt[sectCollection][mode][myClass];
			average_tt[sectCollection][mode][myClass] = (1 / sc.sum * sc.count);
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

/**
 * Method for Showing Details Information for this Predictor, with a Section
 */
exports.getPredictorDetails = function(sectCollection){
	return {
		modes: exports.modes,
		average_tt: average_tt[sectCollection],
		updates_info: global.prediction.getUpdatesInfo(sectCollection, "historical_inv"),
	};
};