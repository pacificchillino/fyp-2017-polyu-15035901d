var config = require("./config.js");
var func = require("./func.js");

exports.name = "Hybrid Kalman Filtering / Regression Models";
exports.description = "Hybrid use of Kalman Filters for time of days, and regressions for other input parameters.";
exports.modes = {
	"default": {
		name: "Default",
		description: "Day Classification: Weekday or Not ; Variables: Rainfall",
		classification: func.getDayClassByWeekdayOrNot,
		classList: func.dayClassListByWeekdayOrNot,
		kalmanMode: "default",
		regressionMode: "default",
	},
	"rain_l": {
		name: "Rainfall (Linear only)",
		description: "Day Classification: Weekday or Not ; Variables: Rainfall Amount",
		classification: func.getDayClassByWeekdayOrNot,
		classList: func.dayClassListByWeekdayOrNot,
		kalmanMode: "default",
		regressionMode: "rain_l",
	},
	"rain_b": {
		name: "Rainfall (Binary only)",
		description: "Day Classification: Weekday or Not ; Variables: Rainfall or Not",
		classification: func.getDayClassByWeekdayOrNot,
		classList: func.dayClassListByWeekdayOrNot,
		kalmanMode: "default",
		regressionMode: "rain_b",
	},
	"hko": {
		name: "Rainfall, HKO Temperature & Humidity",
		description: "Day Classification: Weekday or Not ; Variables: Rainfall, HKO Temperature, Humidity",
		classification: func.getDayClassByWeekdayOrNot,
		classList: func.dayClassListByWeekdayOrNot,
		kalmanMode: "default",
		regressionMode: "hko",
	},
	"dow": {
		name: "Day of Week",
		description: "Day Classification: Day of Week ; Variables: Rainfall",
		classification: func.getDayClassByDayOfWeek,
		classList: func.dayClassListByDayOfWeek,
		kalmanMode: "dow",
		regressionMode: "dow",
	},
	"noclass": {
		name: "No Day Classifications",
		description: "Day Classification: None ; Variables: Rainfall",
		classification: function(data){ return "all"; },
		classList: ["all"],
		kalmanMode: "noclass",
		regressionMode: "noclass",
	},
};

/**
 * Variables:
 * - lastUpdate
 * - average_tt["sectCollection"]
 */

var lastUpdate;

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
};

/**
 * Method for Making a Prediction for a Section
 */
exports.predict = function(sectCollection, mode, inputData){

};