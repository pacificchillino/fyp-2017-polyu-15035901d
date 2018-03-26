var config = require("./config.js");
var func = require("./func.js");

/**
 * Define Prediction Models
 */

var models = {
	//"historical": require("./prediction_historical.js"),
	"kalman": require("./prediction_kalman.js"),
	"regression": require("./prediction_regression.js"),
	"hybrid": require("./prediction_kr_hybrid.js"),
	//"knn": require("./prediction_knn.js"),
	//"neural": require("./prediction_neural.js"),
};

//var modelList = ["hybrid", "kalman", "regression", "knn", "neural", "historical"];
var modelList = ["hybrid", "kalman", "regression"]; //

exports.getModel = function(model){
	return models[model];
}


/**
 * Get Section Collection List
 */

var sectCollectionList = [];

//Trams
for (var i in config.tram_est_sections){
	var _obj = config.tram_est_sections[i];
	var from = (_obj.from_alt != null) ? _obj.from_alt : _obj.from;
	var to = (_obj.to_alt != null) ? _obj.to_alt : _obj.to;
	sectCollectionList.push("data_tram_" + from + "_" + to);
}

/**
 * Get Model List (id, name, description)
 */

exports.getModels = function(){
	var list = [];
	for (var i in modelList){
		var myModel = modelList[i];
		list.push({
			id: myModel,
			name: models[myModel].name,
			description: models[myModel].description,
		});
	}
	return list;
};

exports.getAModel = function(myModel){
	if (models[myModel] != null){
		return {
			id: myModel,
			name: models[myModel].name,
			description: models[myModel].description,
		};
	}
}

/**
 * Get Mode List (id, name, description)
 */

exports.getModes = function(model){
	var list = [];
	if (models[model] != null){
		for (var myMode in models[model].modes){
			list.push({
				id: myMode,
				name: models[model].modes[myMode].name,
				description: models[model].modes[myMode].description,
			});
		}
		return list;
	}
	return [];
}

/**
 * Get hierarical mode / model list
 */
exports.getModelAndModes = function(){
	var data = exports.getModels();
	for (var i in data){
		var myModel = data[i].id;
		data[i].modes = exports.getModes(myModel);
	}
	return data;
};

/**
 * exports.lastUpdate[sc][model]
 * exports.lastUpdateStr[sc][model]
 * exports.timeSpent[sc][model]
 * exports.noOfModes[sc][model]
 * exports.noOfData[sc][model]
 */

exports.lastUpdate = new Object();
exports.lastUpdateStr = new Object();
exports.timeSpent_ms = new Object();
exports.noOfModes = new Object();
exports.noOfData = new Object();

exports.getUpdatesInfo = function(sc, model){
	return {
		lastUpdate: exports.lastUpdate[sc][model],
		lastUpdateStr: exports.lastUpdateStr[sc][model],
		noOfModes: exports.noOfModes[sc][model],
		noOfData: exports.noOfData[sc][model],
		timeSpent_ms: exports.timeSpent_ms[sc][model],
		timeSpent_str: func.exponential(exports.timeSpent_ms[sc][model] / 1000) + " s",
		timeSpentPerMode_str: func.exponential(exports.timeSpent_ms[sc][model] / 1000 / exports.noOfModes[sc][model]) + " s",
		timeSpentPerData_str: func.exponential(exports.timeSpent_ms[sc][model] / 1000 / exports.noOfData[sc][model]) + " s",
		timeSpentPerModeData_str: func.exponential(exports.timeSpent_ms[sc][model] / 1000 / exports.noOfModes[sc][model] / exports.noOfData[sc][model]) + " s",
	};
};

/** 
 * Init
 */

var sc = 0; //Pointer for sectCollectionList
var hasBeenInitiated = false;
var isInitializing = false;

exports.init = function(){
	if (!isInitializing){
		isInitializing = true;
		initForOneSectCollection();
	}
};

function initForOneSectCollection(){
	var mySC = sectCollectionList[sc];
	//Socket msg
	func.msg("Initializing predictions for " + mySC +" (" + (sc+1) + " of " + sectCollectionList.length + ")", config.debug_color.prediction);
	//Set up filter to exclude today data
	var todayString = func.getYYYYMMDD(new Date());
	var filter = {date: {$lt: todayString}};
	//Find from MongoDB
	global.db.collection(mySC).find(filter).toArray(function(err, data) {
		//Define objects
		exports.lastUpdate[mySC] = new Object();
		exports.lastUpdateStr[mySC] = new Object();
		exports.timeSpent_ms[mySC] = new Object();
		exports.noOfModes[mySC] = new Object();
		exports.noOfData[mySC] = new Object();
		//Initialize for Each Model
		for (var myModel in models){
			//No of Modes
			exports.noOfModes[mySC][myModel] = 0; for (var i in models[myModel].modes) exports.noOfModes[mySC][myModel]++;
			//No of Data
			exports.noOfData[mySC][myModel] = data.length;
			//Mark Start Time
			var now = new Date();
			exports.lastUpdate[mySC][myModel] = now;
			exports.lastUpdateStr[mySC][myModel] = func.getYYYYMMDD(now) + " " + func.getHMSOfDay(now);
			//Socket Message
			func.msg("--> " + models[myModel].name, config.debug_color.prediction);
			//Init for each model
			models[myModel].init(mySC, data);
			//Mark Time Spent
			exports.timeSpent_ms[mySC][myModel] = new Date().getTime() - exports.lastUpdate[mySC][myModel].getTime();
			//Socket Message
			func.msg("--> Done. Spent " + (exports.timeSpent_ms[mySC][myModel]/1000) + " seconds.");
		}
		//Next Section or End
		sc++;
		if (sc >= sectCollectionList.length){
			sc = 0;
			isInitializing = false;
			hasBeenInitiated = true;
		}else{
			initForOneSectCollection();
		}
	});
}

/**
 * Prediction
 */

/**
 * [[predictOne]]
 * 
 * Inputs:
 * - sectCollection: Mongo Collection for the Section (either bus or tram)
 * - model: Prediction model used
 * - mode: Prediction mode (respect to the model) used
 * - data: input data (can be without tt_mins)
 */

exports.predictOne = function(sectCollection, model, mode, data){
	//Check if it has been initiated.
	if (hasBeenInitiated){
		//Check if the model and the mode exists
		if (models[model] != null){
			if (models[model].modes[mode] != null){
				return models[model].predict(sectCollection, mode, data);
			}
		}
	}
	return null;
};

/**
 * [[predict]]
 * 
 * Inputs:
 * - sectCollection: Mongo Collection for the Section (either bus or tram)
 * - model: Prediction model used
 * - mode: Prediction mode (respect to the model) used
 * - dataArray: Array of input data items (with tt_mins)
 * 
 * Output result:
 * - result.actual[i]: Actual Value
 * - result.actual2[i]: Actual Value in 2 decimal places
 * - result.predicted[i]: Prediction Result
 * - result.predicted2[i]: Prediction Result in 2 decimal places
 * - result.error[i]: Prediction Error
 * - result.error2[i]: Prediction Error in 2 decimal places
 * - result.maxError, result.maxError2: Maximum Prediction Error
 * - result.minError, result.minError2: Minimum Prediction Error
 * - result.MAE, result.MAE2: Mean Average Error
 * - result.RMSE, result.RMSE2: Root Mean Square Error
 */

exports.predict = function(sectCollection, model, mode, dataArray){
	//Check if it has been initiated.
	if (hasBeenInitiated){
		//Check if the model and the mode exists
		if (models[model] != null){ if (models[model].modes[mode] != null){
			//Declare result object
			var result = {
				count: dataArray.length,
				validCount: 0,
				actual: [],			actual2: [],
				predicted: [],		predicted2: [],
				error: [],			error2: [],
				maxError: false,	maxError2: "",
				minError: false,	minError2: "",
				MAE: 0,				MAE2: "",
				RMSE: 0,			RMSE2: "",
			};
			var validCount = 0;
			//For each data
			for (var i in dataArray){
				var data = dataArray[i];
				//Predicted Result
				var predicted = models[model].predict(sectCollection, mode, dataArray[i]);
				//Actual
				result.actual.push(dataArray[i].tt_mins);
				result.actual2.push(dataArray[i].tt_mins.toFixed(2));
				//Valid
				if (predicted != null){
					//Predicted
					result.predicted.push(predicted);
					result.predicted2.push(predicted.toFixed(2));
					//Error
					var error = Math.abs(dataArray[i].tt_mins - predicted);
					var error2 = error.toFixed(2);
					result.error.push(error);
					result.error2.push(error2);
					//Max & Min Error
					if (result.maxError == false || error > result.maxError){
						result.maxError = error;
						result.maxError2 = error2;
					}
					if (result.minError == false || error < result.minError){
						result.minError = error;
						result.minError2 = error2;
					}
					//MAE & RMSE
					result.MAE += error;
					result.RMSE += error * error;
					//Increment counter
					validCount++;
				}
				//Invalid
				else{
					result.predicted.push(null);
					result.predicted2.push("");
					result.error.push(null);
					result.error2.push("");
				}
			}
			//Summarize MAE & RMSE
			if (validCount > 0){
				result.MAE = result.MAE / validCount;
				result.MAE2 = result.MAE.toFixed(2);
				result.RMSE = Math.sqrt(result.RMSE / validCount);
				result.RMSE2 = result.RMSE.toFixed(2);
			}else{
				result.MAE = null;
				result.MAE2 = "";
				result.RMSE = null;
				result.RMSE2 = "";
			}
			//Update counter
			result.validCount = validCount;
			//Return result
			return result;
		}}
	}
	return null;
};

/**
 * [[predictionErrorSummaryByDate]]
 * 
 * Inputs:
 * - sectCollection: Mongo Collection for the Section (either bus or tram)
 * - model: Prediction model used
 * - mode: Prediction mode (respect to the model) used
 * - dataArray: Array of input data items
 * 
 * Output result:
 * - result.overall.count
 * - result.overall.validCount
 * - result.overall.maxError[2]
 * - result.overall.minError[2]
 * - result.overall.MAE[2]
 * - result.overall.RMSE[2]
 * - result.byDate.[date].maxError[2]
 * - result.byDate.[date].minError[2]
 * - result.byDate.[date].MAE[2]
 * - result.byDate.[date].RMSE[2]
 * - result.byDate.[date].count
 * - result.byDate.[date].validCount
 * - result.computationTime
 * - result.computationTimeAvgAll[2]
 * - result.computationTimeAvgValid[2]
 */

exports.predictionErrorSummaryByDate = function(sectCollection, model, mode, dataArray){
	//Check if it has been initiated.
	if (hasBeenInitiated){
		//Check if the model and the mode exists
		if (models[model] != null){ if (models[model].modes[mode] != null){
			//Declare result object
			var resultTemplate = function(){
				return {
					count: 0,
					validCount: 0,
					maxError: false,	maxError2: "",
					minError: false,	minError2: "",
					MAE: 0,				MAE2: "",
					RMSE: 0,			RMSE2: "",
				};
			};
			var result = {
				overall: resultTemplate(),
				byDate: {},
			};
			//Mark start time
			var startComputationTime = new Date();
			//For each data
			for (var i in dataArray){
				var data = dataArray[i];
				var date = dataArray[i].date;
				//Predicted Result
				var predicted = models[model].predict(sectCollection, mode, dataArray[i]);
				var actual = dataArray[i].tt_mins;
				//Increment Counter
				result.overall.count++;
				if (result.byDate[date] == null){
					result.byDate[date] = resultTemplate();
				}
				result.byDate[date].count++;
				//Valid
				if (predicted != null){
					//Error
					var error = Math.abs(actual - predicted);
					var error2 = error.toFixed(2);
					//Max & Min Error
					if (result.overall.maxError == false || error > result.overall.maxError){
						result.overall.maxError = error;
						result.overall.maxError2 = error2;
					}
					if (result.byDate[date].maxError == false || error > result.byDate[date].maxError){
						result.byDate[date].maxError = error;
						result.byDate[date].maxError2 = error2;
					}
					if (result.overall.minError == false || error < result.overall.minError){
						result.overall.minError = error;
						result.overall.minError2 = error2;
					}
					if (result.byDate[date].minError == false || error < result.byDate[date].minError){
						result.byDate[date].minError = error;
						result.byDate[date].minError2 = error2;
					}
					//MAE & RMSE
					result.overall.MAE += error;
					result.byDate[date].MAE += error;
					result.overall.RMSE += error * error;
					result.byDate[date].RMSE += error * error;
					//Increment counter
					result.overall.validCount ++;
					result.byDate[date].validCount ++;
				};
			};
			//Mark computation time
			var endComputationTime = new Date();
			result.computationTime = endComputationTime.getTime() - startComputationTime.getTime();
			result.computationTime2 = func.exponential(result.computationTime / 1000) + " s";
			result.computationTimeAvgAll = result.computationTime / result.overall.count;
			if (result.overall.count > 0){
				result.computationTimeAvgAll2 = func.exponential(result.computationTimeAvgAll / 1000) + " s";
			}else{
				result.computationTimeAvgAll2 = "";
			}
			result.computationTimeAvgValid = result.computationTime / result.overall.validCount;
			if (result.overall.validCount > 0){
				result.computationTimeAvgValid2 = func.exponential(result.computationTimeAvgValid / 1000) + " s";
			}else{
				result.computationTimeAvgValid2 = "";
			}
			//Summarize
			var summarizeOne = function(item){
				if (item.MAE != false){
					item.MAE = item.MAE / item.validCount;
					item.MAE2 = item.MAE.toFixed(2);
				}
				if (item.RMSE != false){
					item.RMSE = Math.sqrt(item.RMSE / item.validCount);
					item.RMSE2 = item.RMSE.toFixed(2);
				}
				return item;
			}
			result.overall = summarizeOne(result.overall);
			for (var myDate in result.byDate){
				result.byDate[myDate] = summarizeOne(result.byDate[myDate]);
			}
			//Return result
			return result;
		}}
	}
	return null;
};

/**
 * Get model details
 */
exports.getPredictorDetails = function(model, sectCollection){
	if (models[model] == null){
		return null;
	}else if (models[model].getPredictorDetails == null){
		return null;
	}else{
		return models[model].getPredictorDetails(sectCollection);
	}
};