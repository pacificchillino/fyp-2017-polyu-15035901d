var config = require("./config.js");
var func = require("./func.js");

var KalmanFilter = require('kalmanjs').default;

exports.name = "Kalman Filtering Model";
exports.description = "Using Kalman Filters to fit travelling time with respect to day of time.";

var defaultFilter = {R: 0.01, Q: 3};
var lessSensitiveFilter = {R: 0.01, Q: 1};
var moreSensitiveFilter = {R: 0.01, Q: 10};
var defaultSamplingInterval = 60;
var moreFreqSamplingInterval = 10;
var lessFreqSamplingInterval = 300;

exports.modes = {
	"default": {
		name: "Default",
		description: "Classification of Days: Weekday or Not; Sampling Interval: 1 minute ; R (process noise modeller): 0.01 ; Q (measurement noise modeller): 3",
		classification: func.getDayClassByWeekdayOrNot,
		classList: func.dayClassListByWeekdayOrNot,
		samplingInterval: defaultSamplingInterval,
		filter: defaultFilter,
	},
	"more_sen": {
		name: "More Sensitive",
		description: "Classification of Days: Weekday or Not; Sampling Interval: 1 minute ; R (process noise modeller): 0.01 ; Q (measurement noise modeller): 10",
		classification: func.getDayClassByWeekdayOrNot,
		classList: func.dayClassListByWeekdayOrNot,
		samplingInterval: defaultSamplingInterval,
		filter: moreSensitiveFilter,
	},
	"less_sen": {
		name: "Less Sensitive",
		description: "Classification of Days: Weekday or Not; Sampling Interval: 1 minute ; R (process noise modeller): 0.01 ; Q (measurement noise modeller): 1",
		classification: func.getDayClassByWeekdayOrNot,
		classList: func.dayClassListByWeekdayOrNot,
		samplingInterval: defaultSamplingInterval,
		filter: lessSensitiveFilter,
	},
	"more_freq": {
		name: "More Frequent Samplings",
		description: "Classification of Days: Weekday or Not; Sampling Interval: 10 seconds ; R (process noise modeller): 0.01 ; Q (measurement noise modeller): 3",
		classification: func.getDayClassByWeekdayOrNot,
		classList: func.dayClassListByWeekdayOrNot,
		samplingInterval: moreFreqSamplingInterval,
		filter: defaultFilter,
	},
	"less_freq": {
		name: "Less Frequent Samplings",
		description: "Classification of Days: Weekday or Not; Sampling Interval: 5 minutes ; R (process noise modeller): 0.01 ; Q (measurement noise modeller): 3",
		classification: func.getDayClassByWeekdayOrNot,
		classList: func.dayClassListByWeekdayOrNot,
		samplingInterval: lessFreqSamplingInterval,
		filter: defaultFilter,
	},
	"dow": {
		name: "Day of Week",
		description: "Classification of Days: Day of Week; Sampling Interval: 1 minute ; R (process noise modeller): 0.01 ; Q (measurement noise modeller): 3",
		classification: func.getDayClassByDayOfWeek,
		classList: func.dayClassListByDayOfWeek,
		samplingInterval: defaultSamplingInterval,
		filter: defaultFilter,
	},
	"noclass": {
		name: "No Day Classifications",
		description: "Classification of Days: None; Sampling Interval: 1 minute ; R (process noise modeller): 0.01 ; Q (measurement noise modeller): 3",
		classification: function(data){ return "all"; },
		classList: ["all"],
		samplingInterval: defaultSamplingInterval,
		filter: defaultFilter,
	},
};

/**
 * Other functions
 */

//Rotate hours to fit date changing time
function rotateHours(hours){
	hours -= config.hour_date_turnover;
	if (hours < 0) hours += 24;
	return hours;
}


/**
 * Variables:
 * - lastUpdate
 * - average_tt["sectCollection"][mode][class][i]
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
			average_tt[sectCollection][mode][myClass] = [];
			//For each time segment
			var segments = 86400 / exports.modes[mode].samplingInterval;
			for (var t = 0; t < segments; t++){
				average_tt[sectCollection][mode][myClass][t] = {sum: 0, count: 0};
			}
		}
		//For each piece of data
		for (var i in data){
			var myClass = exports.modes[mode].classification(data[i]);
			var mySegment = Math.round(rotateHours(data[i].hours) * 3600 / exports.modes[mode].samplingInterval);
			average_tt[sectCollection][mode][myClass][mySegment].sum += data[i].tt_mins;
			average_tt[sectCollection][mode][myClass][mySegment].count ++;
		}
		//For each class
		for (var i in exports.modes[mode].classList){
			var myClass = exports.modes[mode].classList[i];
			//For each segment --> find mean
			for (var j in average_tt[sectCollection][mode][myClass]){
				var sc = average_tt[sectCollection][mode][myClass][j];
				if (sc.count == 0){
					average_tt[sectCollection][mode][myClass][j] = null;
				}else{
					average_tt[sectCollection][mode][myClass][j] = sc.sum / sc.count;
				}
			}
			//Intepolate missing segments
			average_tt[sectCollection][mode][myClass] = intepolateSeries(average_tt[sectCollection][mode][myClass]);
			//Apply Kalman Filter (skip the null values)
			var myFilter = new KalmanFilter(exports.modes[mode].filter);
			for (var j = 0; j < average_tt[sectCollection][mode][myClass].length; j++){
				if (average_tt[sectCollection][mode][myClass][j] != null){
					average_tt[sectCollection][mode][myClass][j] = myFilter.filter(average_tt[sectCollection][mode][myClass][j]);
				}
			}
		}
		//
	}
};

/**
 * Function to intepolate missing segments
 */

function intepolateSeries(series){
	//Indices for intepolation
	var A, B;
	//Scan all of the series
	for (var i = 1; i < series.length; i++){
		//value --> null: A
		if (series[i-1] != null && series[i] == null){
			A = i-1;
		}
		//null --> value: B
		else if (series[i-1] == null && series[i] != null){
			B = i;
			//Intepolate...
			if (A != null && (B - A > 1)){
				//...between A and B
				var n = B - A;
				for (var j = 1; j < n; j++){
					series[A + j] = series[A] + (series[B] - series[A]) / n * j;
				}
			}
		}
	}
	return series;
}

/**
 * Get mean value from average_tt (also used by "hybrid" mode externally)
 */

exports.getMean = function (sectCollection, mode, data){
	var myClass = exports.getClass(mode, data);
	var mySegment = Math.round(rotateHours(data.hours) * 3600 / exports.modes[mode].samplingInterval);
	return average_tt[sectCollection][mode][myClass][mySegment];
};

/**
 * Get class by data (used by "hybrid" mode externally)
 */

exports.getClass = function(mode, data){
	return exports.modes[mode].classification(data);
};

/**
 * Get list of classes of a mode (used by "hybrid" mode externally)
 */

exports.getClassList = function(mode){
	return exports.modes[mode].classList;
};

/**
 * Method for Making a Prediction for a Section
 */
exports.predict = function(sectCollection, mode, inputData){
	return exports.getMean(sectCollection, mode, inputData);
};