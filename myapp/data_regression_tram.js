var config = require("./config.js");
var func = require("./func.js");
var MLR = require("ml-regression-multivariate-linear");

/**
 * Regression output (one object entry per regressed section):
 * stopA: [code]
 * stopB: [code]
 * lastRegression: [time]
 * common
 * -> mean_by_wkday
 * -> -> d1/d0
 * -> -> -> overall
 * -> -> -> hourly (array with indices 6 - 24)
 * -> mean_by_dayOfWk
 * -> -> d1/d2/d3/d4/d5/d6/d0
 * -> -> -> overall
 * -> -> -> hourly (array with indices 6 - 24)
 * modes
 * -> [mode_code]
 * -> -> [class: d#]
 * -> -> -> weights (array)
 * -> -> -> bias
 */

function classificationFunction(entry, day_classification_by_weekday){
	if (day_classification_by_weekday){
		return entry.wkday ? "d1" : "d0";
	}else{
		if (entry.PH == true){
			return "d0";
		}else{
			return "d" + entry.dayOfWk;
		}
	}
}

function getHoursIntepolation(entry){
	if (entry.hours0 == entry.hours1){
		return {
			hours0: entry.hours0,
			hours0_weight: 1,
			hours1: entry.hours1,
			hours1_weight: 0,
		};
	}else{
		return {
			hours0: entry.hours0,
			hours0_weight: entry.hours1off, //Linear interpolation
			hours1: entry.hours1,
			hours1_weight: entry.hours0off, //Linear interpolation
		};
	}
}

function onehotArray(count, oneIndex){
	var arr = new Array();
	for (var i = 0; i < count; i++){
		arr.push(0);
	}
	if (arr[oneIndex] != null){
		arr[oneIndex] = 1;
	}
	return arr;
}

/**
 * Do regression analysis for a section
 */

exports.doRegressionForSection = function(stopA, stopB, data){

	//New data object
	var sc = function(){
		return {sum: 0, count: 0}; //Temporary object before calculating the final average value
	};
	var mean_obj = function(){
		var hourly = [];
		var hour_start = config.tram_time_start;
		var hour_end = config.tram_time_end;
		if (hour_end < hour_start){
			hour_end += 24;
		}
		for (var i = 0; i < hour_start; i++){
			hourly[i] = -1;
		}
		for (var i = hour_start; i <= hour_end; i++){
			hourly[i] = sc();
		}
		return {overall: sc(), hourly: hourly};
	};
	var result = {
		stopA: stopA,
		stopB: stopB,
		lastRegression: new Date(),
		common: {
			mean_by_wkday: {
				"d1": mean_obj(), "d0": mean_obj(),
			},
			mean_by_dayOfWk: {
				"d1": mean_obj(), "d2": mean_obj(), "d3": mean_obj(), "d4": mean_obj(), "d5": mean_obj(), "d6": mean_obj(), "d0": mean_obj(),
			},
		},
		modes: {},
	};

	//Populate mean data (accept only rainfall = 0)
	for (var i in data){
		//Accept only rainfall = 0
		if (data[i].rainfall == 0){
			//Classification
			var wkday = classificationFunction(data[i], true);
			var dayOfWk = classificationFunction(data[i], false);
			var h = getHoursIntepolation(data[i]);
			//Populate
			result.common.mean_by_wkday[wkday].overall.sum += data[i].tt_mins;
			result.common.mean_by_wkday[wkday].overall.count += 1;
			result.common.mean_by_wkday[wkday].hourly[h.hours0].sum += data[i].tt_mins * h.hours0_weight;
			result.common.mean_by_wkday[wkday].hourly[h.hours0].count += h.hours0_weight;
			result.common.mean_by_wkday[wkday].hourly[h.hours1].sum += data[i].tt_mins * h.hours1_weight;
			result.common.mean_by_wkday[wkday].hourly[h.hours1].count += h.hours1_weight;
			result.common.mean_by_dayOfWk[dayOfWk].overall.sum += data[i].tt_mins;
			result.common.mean_by_dayOfWk[dayOfWk].overall.count += 1;
			result.common.mean_by_dayOfWk[dayOfWk].hourly[h.hours0].sum += data[i].tt_mins * h.hours0_weight;
			result.common.mean_by_dayOfWk[dayOfWk].hourly[h.hours0].count += h.hours0_weight;
			result.common.mean_by_dayOfWk[dayOfWk].hourly[h.hours1].sum += data[i].tt_mins * h.hours1_weight;
			result.common.mean_by_dayOfWk[dayOfWk].hourly[h.hours1].count += h.hours1_weight;
		}
	}

	//Calculate mean = sum / count
	var mean = function(sc){
		return sc.sum / sc.count;
	}
	for (var dd in {"d0": 1, "d1": 1}){
		result.common.mean_by_wkday[dd].overall = mean(result.common.mean_by_wkday[dd].overall);
		for (var i in result.common.mean_by_wkday[dd].hourly){
			if (result.common.mean_by_wkday[dd].hourly[i] != -1){
				result.common.mean_by_wkday[dd].hourly[i] = mean(result.common.mean_by_wkday[dd].hourly[i]);
			}
		}
	}
	for (var dd in {"d0": 1, "d1": 1, "d2": 1, "d3": 1, "d4": 1, "d5": 1, "d6": 1}){
		result.common.mean_by_dayOfWk[dd].overall = mean(result.common.mean_by_dayOfWk[dd].overall);
		for (var i in result.common.mean_by_dayOfWk[dd].hourly){
			if (result.common.mean_by_dayOfWk[dd].hourly[i] != -1){
				result.common.mean_by_dayOfWk[dd].hourly[i] = mean(result.common.mean_by_dayOfWk[dd].hourly[i]);
			}
		}
	}

	//Do regression for each MODE
	for (var modeName in config.tram_regression_modes){
		var mode = config.tram_regression_modes[modeName];

		//Define classes
		if (mode.day_classification_by_weekday){
			//Type 1: by weekday or not
			var classes = ["d1","d0"];
		}else{
			//Type 2: day of week
			var classes = ["d1","d2","d3","d4","d5","d6","d0"];
		}

		//Having no MLR
		if (mode.regression_variables_count == 0){
			result.modes[modeName] = {};
			for (var i in classes){
				result.modes[modeName][classes[i]] = {weights: [], bias: 0};
			}
		}
		//Having MLR
		else{
			result.modes[modeName] = {};
			//Set up inputs (x) and outputs (y) for each class
			var input = {};
			var output = {};
			for (var i in classes){
				input[classes[i]] = new Array();
				output[classes[i]] = new Array();
			}
			//Populate inputs & outputs by data
			for (var i in data){
				//Find class
				var myClass = classificationFunction(data[i], mode.day_classification_by_weekday);
				var myInput = mode.regression_variables(data[i]);
				if (myInput != null){//Calculate mean with corresponding class and time
					if (mode.time_of_day_hourly_mean){
						var t = getHoursIntepolation(data[i]);
						if (mode.day_classification_by_weekday){
							var myMean = result.common.mean_by_wkday[myClass].hourly[t.hours0] * t.hours0_weight
							+ result.common.mean_by_wkday[myClass].hourly[t.hours1] * t.hours1_weight;
						}else{
							var myMean = result.common.mean_by_dayOfWk[myClass].hourly[t.hours0] * t.hours0_weight
							+ result.common.mean_by_dayOfWk[myClass].hourly[t.hours1] * t.hours1_weight;
						}
					}else{
						if (mode.day_classification_by_weekday){
							var myMean = result.common.mean_by_wkday[myClass].overall;
						}else{
							var myMean = result.common.mean_by_dayOfWk[myClass].overall;
						}
					}
					//
					var myOutput = data[i].tt_mins / myMean;
					//Push into classes
					input[myClass].push(myInput);
					output[myClass].push([myOutput]);
				}
			};
			//Do regression
			for (var i in classes){
				var myClass = classes[i];
				var varCount = mode.regression_variables_count;
				var mlr = new MLR(input[myClass], output[myClass]);
				var weights = [];
				//Bias
				var bias = mlr.predict(onehotArray(varCount, -1))[0];
				//Weightings
				for (var i = 0; i < varCount; i++){
					var w = mlr.predict(onehotArray(varCount, i))[0] - bias;
					weights.push(w);
				}
				//Return
				result.modes[modeName][myClass] = {weights: weights, bias: bias};
			}
		}
	}

	//Return result
	return result;
};

/**
 * Do prediction (data: tram journey data, regression: regression data)
 */

exports.doPrediction = function(stopA, stopB, data, regression, mode){
	//Determine Class
	var myClass = classificationFunction(data, config.tram_regression_modes[mode].day_classification_by_weekday);
	//Determine Mean Value
	if (config.tram_regression_modes[mode].day_classification_by_weekday){
		var theMean = regression.common.mean_by_wkday[myClass];
	}else{
		var theMean = regression.common.mean_by_dayOfWk[myClass];
	}
	if (config.tram_regression_modes[mode].time_of_day_hourly_mean){
		//Hourly Mean
		var h = getHoursIntepolation(data);
		var myMean = h.hours0_weight * theMean.hourly[h.hours0] + h.hours1_weight * theMean.hourly[h.hours1];
	}else{
		//Whole Day Mean
		var myMean = theMean.overall;
	}
	//Determine Polynomial
	var myVars = config.tram_regression_modes[mode].regression_variables(data);
	if (myVars == null){
		//Return null
		return null;
	}else{
		//Determine Weight
		var myWeights = regression.modes[mode][myClass].weights;
		var myBias = regression.modes[mode][myClass].bias;
		//Multiply Weights and Bias
		var myPoly = 0;
		for (var i in myWeights){
			myPoly += myWeights[i] * myVars[i];
		}
		myPoly += myBias;
		//Return result
		return myMean * myPoly;
	}
};

/**
 * Do regression analysis on all sections
 */

var regressionTable = "regression_tram";

var updatingPointer = -1;
var updatingTotal = config.tram_est_sections.length;

var updateRegressionOfASection2 = function(){
	//Connect to database
	if (global.db != null){
		//for (var i in config.tram_est_sections){
			var stopA = config.tram_est_sections[updatingPointer].from.split("_")[0];
			var stopB = config.tram_est_sections[updatingPointer].to.split("_")[0];
			var db_table = "data_tram_" + stopA + "_" + stopB;
			global.db.collection(db_table).find({}).toArray(updateRegressionOfASection.bind(
				{stopA: stopA, stopB: stopB}
			));
		//}
	}
};

var updateRegressionOfASection = function(err, result) {
	if (err) throw err;
	if(result.length > 0){
		//Do regression
		var regr = exports.doRegressionForSection(this.stopA, this.stopB, result);
		//Remove from DB if exists
		db.collection(regressionTable).remove({stopA: this.stopA, stopB: this.stopB});
		//Insert new entry
		db.collection(regressionTable).insertOne(regr);
		//Socket Message
		if (updatingPointer == 0){
			func.msg("Tram : Automatic regression starts.", config.debug_color.tram2);
		}
		//Increment Pointer
		updatingPointer++;
		//Socket Message
		var msg = "Tram : ["+this.stopA+"->"+this.stopB+"] Regression done for this section."; 
		msg += " (" + updatingPointer +" of " + updatingTotal + ")";
		func.msg(msg, config.debug_color.tram2);
		//Update Next
		if (updatingPointer < updatingTotal){
			updateRegressionOfASection2();
		}else{
			updatingPointer = -1;
			//Socket Message
			func.msg("Tram : Automatic regression ends.", config.debug_color.tram2);
		}
	}
}

exports.updateRegressions = function(){
	if (updatingPointer == -1){
		//Prevent from interrupting
		updatingPointer = 0;
		updateRegressionOfASection2();
	}
}