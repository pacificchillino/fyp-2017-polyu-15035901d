var config = require("./config.js");
var func = require("./func.js");

var MLR = require("ml-regression-multivariate-linear");

exports.name = "Hybrid Kalman Filtering & Regression Models";
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
 * - predictors["sectCollection"]["mode"]["class"]
 */

var lastUpdate;
var predictors = new Object();

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
	predictors[sectCollection] = new Object();
	//For each mode
	for (var mode in exports.modes){
		var inputs = new Object();
		var outputs = new Object();
		var myClassList = exports.modes[mode].classList;
		//Determine Regression & Kalman Mode
		var myRegressionMode = exports.modes[mode].regressionMode;
		var myKalmanMode = exports.modes[mode].kalmanMode;
		//For each class
		for (var i in myClassList){
			var myClass = myClassList[i];
			inputs[myClass] = new Array();
			outputs[myClass] = new Array();
		}
		//Feed inputs and outputs
		for (var i in data){
			var myInput = global.prediction.getModel("regression").getRegressionVariables(myRegressionMode, data[i]);
			var kalmanFiltered = global.prediction.getModel("kalman").getMean(sectCollection, myKalmanMode, data[i]);
			var myOutput = [data[i].tt_mins / kalmanFiltered];
			var myClass = exports.modes[mode].classification(data[i]);
			if (myInput != null){
				inputs[myClass].push(myInput);
				outputs[myClass].push(myOutput);
			}
		}
		//Construct MLR for each class
		predictors[sectCollection][mode] = new Object();
		for (var i in myClassList){
			var myClass = myClassList[i];
			predictors[sectCollection][mode][myClass] = new MLR(inputs[myClass], outputs[myClass]);
		}
	}
};

/**
 * Method for Making a Prediction for a Section
 */
exports.predict = function(sectCollection, mode, inputData){
	//Do validation first
	if (exports.modes[mode] == null){
		return null;
	}
	if (predictors[sectCollection] == null){
		return null;
	}
	//Do prediction
	var myRegressionMode = exports.modes[mode].regressionMode;
	var myKalmanMode = exports.modes[mode].kalmanMode;
	var myClass = exports.modes[mode].classification(inputData);
	var myRegressionInput = global.prediction.getModel("regression").getRegressionVariables(myRegressionMode, inputData);
	var kalmanFiltered = global.prediction.getModel("kalman").getMean(sectCollection, myKalmanMode, inputData);
	var myRegressionOutput = predictors[sectCollection][mode][myClass].predict(myRegressionInput);
	if (kalmanFiltered == null) return null;
	else if (myRegressionInput[0] == null) return null;
	else return myRegressionOutput[0] * kalmanFiltered;
};