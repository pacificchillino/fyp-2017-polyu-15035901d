var config = require("../config.js");
var func = require("../func.js");
var func_tram_service = require("../func_tram_service.js");
var _ = require('underscore');

var HongKongTrams = require("../include/hongkong-trams.js");
var trams = new HongKongTrams();

/**
 * Common Function
 */

//Function to fill in current factors for empty queries

var fillInQuery = function(_query, stopA, stopB){
	var query = Object.assign({}, _query);
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
			query.rainfall = func_tram_service.getRainfallByTramSection(stopA, stopB);
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

//Function to obtain input variables from query

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

//Function to predict in a tram section (with hour limits imposed)

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
 * Predict a Section
 */

var searchbox_predict_sect = function(model){
	return {
		sections: global.tramSectionsList,
	};
}

exports.tram_data_predict_sect = function (req, res){
	var data = {
		title: "Trams: Predict a Section",
		searchbox: searchbox_predict_sect(),
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
	//Do Prediction for each model and mode
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
			query: req.query,
			query_filled: queries,
			searchbox: searchbox_predict_sect(),
			result: result,
			models_n_modes: models_nm,
		}
		res.render('main/tram_predict_section', data);
	}else{
		var data = {
			params: req.params,
			query: req.query,
			query_filled: queries,
			result: result,
		}
		res.send(JSON.stringify(data));
	}
};

//Specific Model (API Only)

exports.tram_data_predict_sect_result_api_m1 = function (req, res){
	//Define result object
	var result = {};
	//Fill in queries
	var queries = fillInQuery(req.query, req.params.stopA, req.params.stopB);
	//Get input variables for prediction
	var inputVariables = getInputVariables(queries);
	//Get Models and Modes
	var myModel = req.params.model;
	var modes = global.prediction.getModes(myModel);
	//Do Prediction for each mode
	for (var j in modes){
		var myMode = modes[j].id;
		//If there are no problems in input variables, get prediction result
		if (inputVariables != null){
			var predicted = predictForTram(req.params.stopA, req.params.stopB, myModel, myMode, inputVariables);
		}else{
			var predicted = null;
		}
		//Prediction result
		if (predicted != null){
			result[myMode] = {
				mins: predicted,
				mins2: predicted.toFixed(2),
				start_time: func.getHMSByHours(inputVariables.hours),
				end_time: func.getHMSByHours(inputVariables.hours + predicted / 60),
			};
		}else{
			result[myMode] = {
				mins: null,
				mins2: "",
				start_time: "",
				end_time: "",
			};
		}
	}
	//Response
	var data = {
		params: req.params,
		query: req.query,
		query_filled: queries,
		result: result,
	}
	res.send(JSON.stringify(data));
};

//Specific Model, Mode (API Only)

exports.tram_data_predict_sect_result_api_m2 = function (req, res){
	//Fill in queries
	var queries = fillInQuery(req.query, req.params.stopA, req.params.stopB);
	//Get input variables for prediction
	var inputVariables = getInputVariables(queries);
	//If there are no problems in input variables, get prediction result
	if (inputVariables != null){
		var predicted = predictForTram(req.params.stopA, req.params.stopB, req.params.model, req.params.mode, inputVariables);
	}else{
		var predicted = null;
	}
	//Prediction result
	if (predicted != null){
		var result = {
			mins: predicted,
			mins2: predicted.toFixed(2),
			start_time: func.getHMSByHours(inputVariables.hours),
			end_time: func.getHMSByHours(inputVariables.hours + predicted / 60),
		};
	}else{
		var result = {
			mins: null,
			mins2: "",
			start_time: "",
			end_time: "",
		};
	}
	//Response
	var data = {
		params: req.params,
		query: req.query,
		query_filled: queries,
		result: result,
	}
	res.send(JSON.stringify(data));
};

/**
 * Predict "From / To"
 */

var searchbox_predict = function(model){
	return {
		menu_json: JSON.stringify(global.tramPredictionServiceMenu),
	};
}

exports.tram_data_predict = function (req, res){
	var data = {
		title: "Trams: Travelling Time Prediction",
		searchbox: searchbox_predict(),
	};
	res.render('main/tram_predict', data);
};

exports.tram_data_predict_result = function (req, res){
	tram_data_predict_result(req, res, false);
};

exports.tram_data_predict_result_api = function (req, res){
	tram_data_predict_result(req, res, true);
};

var tram_data_predict_result = function (req, res, isAPI){
	//Define objects
	var result = {};
	//Sections & Queries
	var sections = tram_data_predict_result_getSections(req);
	var queries = tram_data_predict_result_getQueries(req, sections);
	//Get Models and Modes
	var models_nm = global.prediction.getModelAndModes();
	//Do Prediction for each model and mode
	for (var i in models_nm){
		var myModel = models_nm[i].id;
		result[myModel] = {};
		for (var j in models_nm[i].modes){
			var myMode = models_nm[i].modes[j].id;
			result[myModel][myMode] = tram_data_predict_result_each_mm(req, sections, queries, myModel, myMode);
		}
	}
	//Response
	if (!isAPI){
		var data = {
			title: "Trams: Travelling Time Prediction",
			params: req.params,
			query: req.query,
			query_filled: queries,
			sections: sections,
			searchbox: searchbox_predict(),
			result: result,
			models_n_modes: models_nm,
		}
		res.render('main/tram_predict', data);
	}else{
		var data = {
			params: req.params,
			query: req.query,
			query_filled: queries,
			sections: sections,
			result: result,
		}
		res.send(JSON.stringify(data));
	}
};

var tram_data_predict_result_getSections = function (req){
	//Determine from_to
	var from = req.params.from;
	var to = req.params.to;
	var isMulti = req.params.isMulti;
	var stops = func_tram_service.getTramPredictionServiceFromToSections(from, to, isMulti);
	var list = [];
	for (var i in stops){
		var stop = stops[i];
		list.push({
			id: stop,
			name: config.tram_stops_for_eta[stop].name,
			direction: config.tram_stops_for_eta[stop].direction,
		});
	}
	return list;
};

var tram_data_predict_result_getQueries = function (req, sections){
	var queries = new Array();
	for (var i = 1; i < sections.length; i++){
		var stopA = sections[i-1].id;
		var stopB = sections[i].id;
		var query = fillInQuery(req.query, stopA, stopB);
		queries.push(query);
	}
	return queries;
};

var tram_data_predict_result_each_mm = function (req, sections, queries, model, mode){
	var sectCollections = new Array();
	var result = new Array();
	var cum_mins = 0;
	var hours;
	for (var i = 1; i < sections.length; i++){
		var stopA = sections[i-1].id;
		var stopB = sections[i].id;
		var input = getInputVariables(queries[i-1]);
		if (input == null){
			return [];
			break;
		}
		//Start prediction
		if (hours == null) hours = input.hours;
		input.hours = hours;
		var mins = predictForTram(stopA, stopB, model, mode, input);
		if (mins == null){
			return [];
			break;
		}
		cum_mins += mins;
		var hours_new = hours + mins / 60;
		result.push({
			hours_start: hours,
			hours_end: hours_new,
			time_start: func.getHMSByHours(hours),
			time_end: func.getHMSByHours(hours_new),
			mins: mins,
			mins2: mins.toFixed(2),
			cum_mins: cum_mins,
			cum_mins2: cum_mins.toFixed(2),
		});
		hours = hours_new;
	}
	//Return result
	return result;
};

//API only
exports.tram_data_predict_result_api_m1 = function (req, res){
	//Define objects
	var result = {};
	//Sections & Queries
	var sections = tram_data_predict_result_getSections(req);
	var queries = tram_data_predict_result_getQueries(req, sections);
	//Get Models and Modes
	var myModel = req.params.model;
	var modes = global.prediction.getModes(myModel);
	//Do Prediction for each mode
	for (var j in modes){
		var myMode = modes[j].id;
		result[myMode] = tram_data_predict_result_each_mm(req, sections, queries, myModel, myMode);
	}
	//Return Data
	var data = {
		params: req.params,
		query: req.query,
		query_filled: queries,
		sections: sections,
		result: result,
	}
	res.send(JSON.stringify(data));
};

exports.tram_data_predict_result_api_m2 = function (req, res){
	//Define objects
	var result = {};
	//Sections & Queries
	var sections = tram_data_predict_result_getSections(req);
	var queries = tram_data_predict_result_getQueries(req, sections);
	//Get Models and Modes
	var myModel = req.params.model;
	var myMode = req.params.mode;
	//Do Prediction
	result = tram_data_predict_result_each_mm(req, sections, queries, myModel, myMode);
	//Return Data
	var data = {
		params: req.params,
		query: req.query,
		query_filled: queries,
		sections: sections,
		result: result,
	}
	res.send(JSON.stringify(data));
};

/**
 * Predict ETA
 */

var searchbox_eta = function(model){
	return {
		stops: global.tramETAServiceMenu,
	};
}

exports.tram_data_predict_eta = function (req, res){
	var data = {
		title: "Trams: ETA with Predictions",
		searchbox: searchbox_eta(),
	};
	res.render('main/tram_predict_eta', data);
};

exports.tram_data_predict_eta_result = function (req, res){
	tram_data_predict_eta_result(req, res, false);
};

exports.tram_data_predict_eta_result_api = function (req, res){
	tram_data_predict_eta_result(req, res, true);
};

var tram_data_predict_eta_result = function (req, res, isAPI, model, mode){ //model, mode are optional
	var result = {};
	var EM = {};
	//Obtain Data
	var promises = new Array();
	//Get Models and Modes
	var models_nm = global.prediction.getModelAndModes();
	//Stop name
	var stop_name = req.params.stop_name;
	//For stop code, convert to stop name
	if (config.tram_stops_for_eta[stop_name] != null){
		stop_name = config.tram_stops_for_eta[stop_name].name;
	}
	//Obtain ETAs
	var etaObtainedFunction = function(eta){
		result[this.stop].eta = eta;
		//Predict for each ETA
		for (var i in result[this.stop].eta){
			result[this.stop].eta[i] = tram_data_predict_eta_result_each(this.stop, result[this.stop].eta[i], model, mode);
		}
	};
	var etaObtainFailedFunction = function(){
		result[this.stop].eta = [];
	};
	var emObtainedFunction = function(message){
		EM[this.stop] = message;
	};
	var emObtainFailedFunction = function(message){
		EM[this.stop] = "";
	};
	for (var direction in global.tramETAServiceMenu[stop_name]){
		var stop = global.tramETAServiceMenu[stop_name][direction];
		//ETA
		result[stop] = {};
		result[stop].direction = direction;
		result[stop].isTerminus = config.tram_stops_for_eta[stop].isTerminus;
		promises.push(
			trams.getNextTramETA(stop).then(
				etaObtainedFunction.bind({stop: stop})
			).catch(
				etaObtainFailedFunction.bind({stop: stop})
			)
		);
		//Emergency Message
		promises.push(
			trams.getEmergencyMessageForTramStop(stop).then(
				emObtainedFunction.bind({stop: stop})
			).catch(
				emObtainFailedFunction.bind({stop: stop})
			)
		);
	}
	//Return list
	Promise.all(promises).then(function(){
		if (!isAPI){
			var data = {
				title: "Trams: ETA with Predictions",
				params: req.params,
				query: req.query,
				searchbox: searchbox_eta(),
				models_n_modes: models_nm,
				result: result,
				EM: EM,
			}
			res.render('main/tram_predict_eta', data);
		}else{
			var data = {
				params: req.params,
				result: result,
				EM: EM,
			}
			res.send(JSON.stringify(data));
		}
	});
};

//API only
exports.tram_data_predict_eta_result_api_m1 = function (req, res){
	tram_data_predict_eta_result(req, res, true, req.params.model, null);
};

exports.tram_data_predict_eta_result_api_m2 = function (req, res){
	tram_data_predict_eta_result(req, res, true, req.params.model, req.params.mode);
};

//Predict for each ETA item
var tram_data_predict_eta_result_each = function(stop, eta, model, mode){
	var result = Object.assign({}, eta);
	result.sections = [];
	result.predicted = {};
	//isTerminus
	var isTerminus = config.tram_stops_for_eta[stop].isTerminus;
	var dest = eta.dest_stop_code;
	//Find stop list
	var stops = [stop];
	var nextStopFound = true;
	while (nextStopFound){
		nextStopFound = false;
		var recentStop = stops[stops.length - 1];
		console.log(recentStop);
		for (var i = 0; i < config.tram_est_sections.length; i++){
			var item = config.tram_est_sections[i];
			//Matches from
			if (item.from == recentStop || item.from_alt == recentStop){
				//Not special section
				if (item.isSpecialSection != true){
					//Matches destination
					if (_.indexOf(item.dest, dest) != -1){
						stops[stops.length - 1] = (item.from_alt != null) ? item.from_alt : item.from;
						stops.push((item.to_alt != null) ? item.to_alt : item.to);
						nextStopFound = true;
						i = config.tram_est_sections.length; //Break loop
					}
				}
			}
		}
	};
	//Do prediction
	var basisTime = func.getHoursByDate();
	if (!isTerminus){ //For non-terminus, take ETA time
		basisTime += eta.arrive_in_second / 3600;
	}
	//Prediction Function (model, mode, stops, time)
	var predictSub = function(model, mode){
		var result_sub = [];
		var hours = basisTime;
		var cum_mins = 0;
		for (var i = 1; i < stops.length; i++){
			var stopA = stops[i-1];
			var stopB = stops[i];
			var queries = fillInQuery({}, stopA, stopB);
			var input = getInputVariables(queries);
			if (input == null){
				i = stops.length;
			}else{
				//Start prediction
				input.hours = hours;
				var mins = predictForTram(stopA, stopB, model, mode, input);
				if (mins == null){
					i = stops.length;
				}else{
					cum_mins += mins;
					var hours_new = hours + mins / 60;
					result_sub.push({
						hours_start: hours,
						hours_end: hours_new,
						time_start: func.getHMSByHours(hours),
						time_end: func.getHMSByHours(hours_new),
						mins: mins,
						mins2: mins.toFixed(2),
						cum_mins: cum_mins,
						cum_mins2: cum_mins.toFixed(2),
					});
					hours = hours_new;
				}
			}
		}
		return result_sub;
	};
	//Get Stop List
	for (var i in stops){
		var stop_id = stops[i];
		result.sections.push({
			id: stop_id,
			name: config.tram_stops_for_eta[stop_id].name,
			direction: config.tram_stops_for_eta[stop_id].direction,
		});
	}
	//Get Models and Modes
	var models_nm = global.prediction.getModelAndModes();
	//Type 1: all models & modes
	if (model == null){
		for (var i in models_nm){
			var myModel = models_nm[i].id;
			result.predicted[myModel] = {};
			for (var j in models_nm[i].modes){
				var myMode = models_nm[i].modes[j].id;
				result.predicted[myModel][myMode] = predictSub(myModel, myMode);
			}
		}
	}
	//Type 2: all modes in a model
	else if (mode == null){
		var modes = global.prediction.getModes(model);
		for (var j in modes){
			var myMode = modes[j].id;
			result.predicted[myMode] = predictSub(model, myMode);
		}
	}
	//Type 3: a specific mode in a model
	else{
		result.predicted = predictSub(model, mode);
	}
	//Return
	return result;
};