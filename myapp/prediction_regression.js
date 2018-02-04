var config = require("./config.js");
var func = require("./func.js");

var MLR = require("ml-regression-multivariate-linear");

exports.name = "Regression Model";
exports.description = "Using regressions for predicting travelling time with mulitple input parameters.";
exports.modes = {
	"default": {
		name: "Default",
		description: "Day Classification: Weekday or Not ; Variables: Rainfall",
		classification: func.getDayClassByWeekdayOrNot,
		classList: func.dayClassListByWeekdayOrNot,
		regression_variables_label: ["R","r"],
		regression_variables_remarks: ["R: Rainfall (in mm)","r: [1 if there is rainfall, 0 else]"],
		regression_variables: function(data){
			return [
				data.rainfall,
				(data.rainfall > 0) ? 1 : 0,
			];
		},
	},
	"rain_l": {
		name: "Rainfall (Linear only)",
		description: "Day Classification: Weekday or Not ; Variables: Rainfall Amount",
		classification: func.getDayClassByWeekdayOrNot,
		classList: func.dayClassListByWeekdayOrNot,
		regression_variables_label: ["R"],
		regression_variables_remarks: ["R: Rainfall (in mm)"],
		regression_variables: function(data){
			return [
				data.rainfall,
			];
		},
	},
	"rain_b": {
		name: "Rainfall (Binary only)",
		description: "Day Classification: Weekday or Not ; Variables: Rainfall or Not",
		classification: func.getDayClassByWeekdayOrNot,
		classList: func.dayClassListByWeekdayOrNot,
		regression_variables_label: ["r"],
		regression_variables_remarks: ["r: [1 if there is rainfall, 0 else]"],
		regression_variables: function(data){
			return [
				(data.rainfall > 0) ? 1 : 0,
			];
		},
	},
	"hko": {
		name: "Rainfall, HKO Temperature & Humidity",
		description: "Day Classification: Weekday or Not ; Variables: Rainfall, HKO Temperature, Humidity",
		classification: func.getDayClassByWeekdayOrNot,
		classList: func.dayClassListByWeekdayOrNot,
		regression_variables_label: ["R", "r", "T", "H"],
		regression_variables_remarks: ["R: Rainfall (in mm)","r: [1 if there is rainfall, 0 else]","T: HKO Temperature (in ℃)","H: HKO Humidity (in %)"],
		regression_variables: function(data){
			if (data.HKO_temp != null && data.HKO_hum != null){
				return [
					data.rainfall,
					(data.rainfall > 0) ? 1 : 0,
					data.HKO_temp,
					data.HKO_hum,
				];
			}else{
				return null;
			}
		},
	},
	"dow": {
		name: "Day of Week",
		description: "Day Classification: Day of Week ; Variables: Rainfall",
		classification: func.getDayClassByDayOfWeek,
		classList: func.dayClassListByDayOfWeek,
		regression_variables_label: ["R","r"],
		regression_variables_remarks: ["R: Rainfall (in mm)","r: [1 if there is rainfall, 0 else]"],
		regression_variables: function(data){
			return [
				data.rainfall,
				(data.rainfall > 0) ? 1 : 0,
			];
		},
	},
	"noclass": {
		name: "No Day Classifications",
		description: "Day Classification: None ; Variables: Rainfall",
		classification: function(data){ return "all"; },
		classList: ["all"],
		regression_variables_label: ["R","r"],
		regression_variables_remarks: ["R: Rainfall (in mm)","r: [1 if there is rainfall, 0 else]"],
		regression_variables: function(data){
			return [
				data.rainfall,
				(data.rainfall > 0) ? 1 : 0,
			];
		},
	},
	"time_4": {
		name: "Time of Day: 4-Degree Polynomial",
		description: "Day Classification: Day of Week ; Variables: Rainfall, Normalized time of Day up to Degree 4",
		classification: func.getDayClassByWeekdayOrNot,
		classList: func.dayClassListByWeekdayOrNot,
		regression_variables_label: ["t<sup>4</sup>","t<sup>3</sup>","t<sup>2</sup>","t","R","r"],
		regression_variables_remarks: ["t: Normalized time of day (0 ~ 1, i.e. hours / 24)","R: Rainfall (in mm)","r: [1 if there is rainfall, 0 else]"],
		regression_variables: function(data){
			var tod = data.hours / 24;
			var m = 1;
			var arr = [];
			for (var i = 0; i < 4; i++){
				m *= tod;
				arr.unshift(m);
			}
			arr.push(data.rainfall);
			arr.push((data.rainfall > 0) ? 1 : 0);
			return arr;
		},
	},
	"time_6": {
		name: "Time of Day: 6-Degree Polynomial",
		description: "Day Classification: Day of Week ; Variables: Rainfall, Normalized time of Day up to Degree 6",
		classification: func.getDayClassByWeekdayOrNot,
		classList: func.dayClassListByWeekdayOrNot,
		regression_variables_label: ["t<sup>6</sup>","t<sup>5</sup>","t<sup>4</sup>","t<sup>3</sup>","t<sup>2</sup>","t","R","r"],
		regression_variables_remarks: ["t: Normalized time of day (0 ~ 1, i.e. hours / 24)","R: Rainfall (in mm)","r: [1 if there is rainfall, 0 else]"],
		regression_variables: function(data){
			var tod = data.hours / 24;
			var m = 1;
			var arr = [];
			for (var i = 0; i < 6; i++){
				m *= tod;
				arr.unshift(m);
			}
			arr.push(data.rainfall);
			arr.push((data.rainfall > 0) ? 1 : 0);
			return arr;
		},
	},
	"time_8": {
		name: "Time of Day: 8-Degree Polynomial",
		description: "Day Classification: Day of Week ; Variables: Rainfall, Normalized time of Day up to Degree 8",
		classification: func.getDayClassByWeekdayOrNot,
		classList: func.dayClassListByWeekdayOrNot,
		regression_variables_label: ["t<sup>8</sup>","t<sup>7</sup>","t<sup>6</sup>","t<sup>5</sup>","t<sup>4</sup>","t<sup>3</sup>","t<sup>2</sup>","t","R","r"],
		regression_variables_remarks: ["t: Normalized time of day (0 ~ 1, i.e. hours / 24)","R: Rainfall (in mm)","r: [1 if there is rainfall, 0 else]"],
		regression_variables: function(data){
			var tod = data.hours / 24;
			var m = 1;
			var arr = [];
			for (var i = 0; i < 8; i++){
				m *= tod;
				arr.unshift(m);
			}
			arr.push(data.rainfall);
			arr.push((data.rainfall > 0) ? 1 : 0);
			return arr;
		},
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
 * Get regression variables by data (used by "hybrid" mode externally)
 */

exports.getRegressionVariables = function(mode, data){
	return exports.modes[mode].regression_variables(data);
};

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
		//For each class
		for (var i in myClassList){
			var myClass = myClassList[i];
			inputs[myClass] = new Array();
			outputs[myClass] = new Array();
		}
		//Feed inputs and outputs
		for (var i in data){
			var myInput = exports.modes[mode].regression_variables(data[i]);
			var myOutput = [data[i].tt_mins];
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
	var myClass = exports.modes[mode].classification(inputData);
	var myInput = exports.modes[mode].regression_variables(inputData);
	if (myInput != null){
		var myOutput = predictors[sectCollection][mode][myClass].predict(myInput);
		return myOutput[0];
	}else{
		return null;
	}
};