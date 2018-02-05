var config = require("../config.js");
var func = require("../func.js");

/**
 * Search Box
 */

var searchbox = function(model){
	return {
		sections: func.getTramSectionsList(),
	};
}

/**
 * Function to fill in current factors for empty queries
 */

var fillInQuery = function(query, stopA, stopB){
	if (query.dow == null){
		if (global.dayOfWeek != null){
			query.dow = global.dayOfWeek;
		}
	}
	if (query.ph == null){
		if (global.isPH != null){
			query.ph = global.isPH ? 1 : 0;
		}
	}
	if (query.time == null){
		query.time = func.getHMSOfDay();
	}
	if (query.rainfall == null){
		if (global.weather != null){ if (global.weather.rainfall != null){
			query.rainfall = func.getRainfallByTramSection(stopA, stopB);
		}}
	}
	if (query.hkotemp == null){
		if (global.weather != null){ if (global.weather.HKO_temp != null){
			query.hkotemp = global.weather.HKO_temp;
		}}
	}
	if (query.hkohum == null){
		if (global.weather != null){ if (global.weather.HKO_hum != null){
			query.hkohum = global.weather.HKO_hum;
		}}
	}
	//Sunday should be public holiday
	if (query.dow == 0){
		query.ph = 1;
	}
	//Return
	return query;
};

/**
 * Function to obtain input variables from query
 */

var getInputVariables = function(query, stopA, stopB){ //query must be processed by fillInQuery(..)
	if (query.dow == null) return null;
	if (query.ph == null) return null;
	if (query.time == null) return null;
	if (query.rainfall == null) return null;
	if (query.hkotemp == null) return null;
	if (query.hkohum == null) return null;
	var hours = func.getHours(query.time);
	var rainfall = query.rainfall - 0;
	var HKO_temp = query.hkotemp - 0;
	var HKO_hum = query.hkohum - 0;
	if (hours == null) return null;
	if (isNaN(rainfall)) return null;
	if (isNaN(HKO_temp)) return null;
	if (isNaN(HKO_hum)) return null;
	return {
		PH: (query.ph == 1),
		dayOfWk: query.dow,
		hours: hours,
		rainfall: rainfall,
		HKO_temp: HKO_temp,
		HKO_hum: HKO_hum,
	}
};

/**
 * Function to predict in a tram section (with hour limits imposed)
 */

var predictForTram = function(stopA, stopB, model, mode, data){
	var hours = data.hours;
	var time_start = config.tram_time_start;
	var time_end = config.tram_time_end;
	if (hours < config.hour_date_turnover) hours += 24;
	if (time_end < config.hour_date_turnover) time_end += 24;
	if (hours < time_start || hours > time_end){
		return null;
	}else{
		var sc = "data_tram_" + stopA + "_" + stopB;
		return global.prediction.predictOne(sc, model, mode, data);
	}
}

/**
 * Predict a Section - Search Box Only
 */

exports.tram_data_predict_sect = function (req, res){
	var data = {
		title: "Trams: Predict a Section",
		searchbox: searchbox(),
	};
	res.render('main/tram_predict_section', data);
};

/**
 * Predict a Section - Results
 */

exports.tram_data_predict_sect_result = function (req, res){
	tram_data_predict_sect_result(req, res, false);
};

exports.tram_data_predict_sect_result_api = function (req, res){
	tram_data_predict_sect_result(req, res, true);
};

var tram_data_predict_sect_result = function (req, res, isAPI){
	//Define result object
	var result = {};
	//Fill in queries
	var queries = fillInQuery(req.query, req.params.stopA, req.params.stopB);
	//Get input variables for prediction
	var inputVariables = getInputVariables(queries);
	//Get Models and Modes
	var models_nm = global.prediction.getModelAndModes();
	//Do Prediction for each model and Mode
	for (var i in models_nm){
		var myModel = models_nm[i].id;
		result[myModel] = {};
		for (var j in models_nm[i].modes){
			var myMode = models_nm[i].modes[j].id;
			//If there are no problems in input variables, get prediction result
			if (inputVariables != null){
				var predicted = predictForTram(req.params.stopA, req.params.stopB, myModel, myMode, inputVariables);
			}else{
				var predicted = null;
			}
			//Prediction result
			if (predicted != null){
				result[myModel][myMode] = {
					mins: predicted,
					mins2: predicted.toFixed(2),
					start_time: func.getHMSByHours(inputVariables.hours),
					end_time: func.getHMSByHours(inputVariables.hours + predicted / 60),
				};
			}else{
				result[myModel][myMode] = {
					mins: null,
					mins2: "",
					start_time: "",
					end_time: "",
				};
			}
		}
	}
	//Response
	if (!isAPI){
		var data = {
			title: "Trams: Predict a Section",
			params: req.params,
			query: queries,
			searchbox: searchbox(),
			result: result,
			models_n_modes: models_nm,
		}
		res.render('main/tram_predict_section', data);
	}else{
		var data = {
			params: req.params,
			query: queries,
			result: result,
		}
		res.send(JSON.stringify(data));
	}
};