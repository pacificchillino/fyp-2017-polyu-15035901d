var config = require("../config.js");
var func = require("../func.js");
var _ = require('underscore');
var data_regression_tram = require("../data_regression_tram.js");

/**
 * Define Variables
 */

var mapVariablesToEntry = function (query){
	//Check if variables are missing: PH, dayOfWk, hours, rainfall, HKO_temp, HKO_hum
	var invalid = function(value){
		return value == null || value == "";
	}
	var flag = true;
	if (invalid(query.PH)) flag = false;
	if (invalid(query.dayOfWk)) flag = false;
	if (invalid(query.hours)) flag = false;
	if (invalid(query.rainfall)) flag = false;
	if (invalid(query.HKO_temp)) flag = false;
	if (invalid(query.HKO_hum)) flag = false;
	if (!flag){
		return null;
	}else{
		flag = true;
		//Translate
		var PH = (query.PH == "1") ? true : false;
		if (isNaN(PH)) flag = false;
		var DOW = parseInt(query.dayOfWk);
		if (isNaN(DOW)) flag = false;
		var hours = (query.hours)-0;
		if (isNaN(hours)) flag = false;
		var rainfall = (query.rainfall)-0;
		if (isNaN(rainfall)) flag = false;
		var HKO_temp = (query.HKO_temp)-0;
		if (isNaN(HKO_temp)) flag = false;
		var HKO_hum = (query.HKO_hum)-0;
		if (isNaN(HKO_hum)) flag = false;
	}
	if (!flag){
		return null;
	}else{
		flag = true;
		//Limit Hours Range
		var hour_min = config.tram_time_start;
		var hour_max = config.tram_time_end;
		if (hour_max < hour_min) hour_max += 24;
		if (hours < hour_min || hours > hour_max){
			flag = false;
		}
	}
	if (!flag){
		return null;
	}else{
		flag = true;
		//Construct new data entry
		var data = {
			wkday: (DOW >= 1) && (DOW <= 5) && (!PH), //Mon to Fri, not Public Holiday
			PH: PH,
			dayOfWk: DOW,
			hours: hours,
			rainfall: rainfall,
			HKO_temp: HKO_temp,
			HKO_hum: HKO_hum,
		};
		//Intepolate hours
		var time_hours_left = Math.floor(hours);
		var time_hours_right = Math.ceil(hours);
		if (time_hours_left % 2 == 0){
			//Left is even
			data.hours0 = time_hours_left;
			data.hours0off = hours - time_hours_left;
			data.hours1 = time_hours_right;
			data.hours1off = time_hours_right - hours;
		}else{
			//Left is odd
			data.hours1 = time_hours_left;
			data.hours1off = hours - time_hours_left;
			data.hours0 = time_hours_right;
			data.hours0off = time_hours_right - hours;
		}
		//Return
		return data;
	}
};

var getPredictionFromTos = function(){
	var list = {name: {}, via:{}};
	//Convert XXX_X to XXX
	var xxx = function(str){
		return str.split("_")[0];
	}
	//List names
	for (var i in config.tram_prediction_options){
		var stop = xxx(config.tram_prediction_options[i]);
		list.name[stop] = config.tram_stops_for_eta[config.tram_prediction_options[i]].name;
	}
	//Permutate in tram_prediction_from_to
	for (var i in config.tram_prediction_from_to){
		var entry = config.tram_prediction_from_to[i];
		//Type 1: between
		if (entry.between != null){
			for (var a = 0; a < entry.between.length - 1; a++){
				for (var b = a + 1; b < entry.between.length; b++){ // a <= b
					var stopA = xxx(entry.between[a]);
					var stopB = xxx(entry.between[b]);
					var via = [];
					for (var j = a; j <= b; j++){
						via.push(xxx(entry.between[j]));
					}
					if (list.via[stopA] == null) list.via[stopA] = {};
					if (list.via[stopA][stopB] == null) list.via[stopA][stopB] = {};
					list.via[stopA][stopB][(b - a) > 2 ? 1 : 0] = {
						via: via,
					};
				}
			}
		}
		//Type 2: from, to
		else{
			for (var a = 0; a < entry.from.length; a++){
				for (var b = 0; b < entry.to.length; b++){
					var stopA = xxx(entry.from[a]);
					var stopB = xxx(entry.to[b]);
					var via = [];
					for (var j = a; j < entry.from.length; j++){
						via.push(xxx(entry.from[j]));
					}
					for (var j = b; j < entry.to.length; j++){
						via.push(xxx(entry.to[j]));
					}
					if (list.via[stopA] == null) list.via[stopA] = {};
					if (list.via[stopA][stopB] == null) list.via[stopA][stopB] = {};
					list.via[stopA][stopB][(b - a) > 2 ? 1 : 0] = {
						via: via,
					};
				}
			}
		}
	}
	return list;
};

//List: from_to_list.name[stop]
//List: from_to_list.via[stopA][stopB][multiple_sections ? 1 : 0]

var from_to_list = getPredictionFromTos();

/**
 * Default Values for Query Box
 */

function default_data(){
	var now = new Date();
	var def = {};
	//Day of Week
	def.dayOfWk = now.getDay().toString();
	//Public Holiday
	def.PH = global.isPH ? "1" : "0";
	//Hours
	def.hours = func.getHMSOfDay(now);
	//Rainfall
	if (global.weather != null){
		var sum = 0;
		var count = 0;
		for (var i in global.weather.rainfall){
			sum += global.weather.rainfall[i];
			count++;
		}
		if (count == 0){
			def.rainfall = 0;
		}else{
			def.rainfall = sum / count;
		}
		//HKO Temp
		def.HKO_temp = global.weather.HKO_temp;
		//HKO Hum
		def.HKO_hum = global.weather.HKO_hum;
	}
	//Return
	return def;
}

/**
 * Query Box
 */

function tram_data_sect_querybox(){
	var querybox = {
		sections: [],
		def: default_data(),
	};
	for (var i in config.tram_est_sections){
		var from = config.tram_est_sections[i].from.split("_")[0];
		var to = config.tram_est_sections[i].to.split("_")[0];
		querybox.sections.push({
			from_to: from + "/" + to,
			caption: from + " to " + to + " (" + config.tram_stops_for_eta[config.tram_est_sections[i].from].name + " to " + config.tram_stops_for_eta[config.tram_est_sections[i].to].name + ")",
		});
	}
	return querybox;
}

/**
 * Predict Section - Query Box Only
 */

exports.tram_pred_sect = function(req, res){
	var data = {
		title: "Travelling Time Prediction of a Section",
		querybox: tram_data_sect_querybox(),
	};
	res.render('main/tram_pred_sect', data);
};

/**
 * Predict Section - Result
 */

exports.tram_pred_sect_result = function(req, res){
	//Prepare Data
	var entry = mapVariablesToEntry(req.query);
	var flag = (entry == null);
	//Data
	var data = {
		title: "Travelling Time Prediction of a Section",
		querybox: tram_data_sect_querybox(),
		params: req.params,
		query: req.query,
		error: flag,
	};
	if (!flag){
		//Okay --> Find regression specs
		var stopA = req.params.stopA;
		var stopB = req.params.stopB;
		var filter_regr = { stopA: stopA, stopB: stopB };
		var db_regr = "regression_tram";
		global.db.collection(db_regr).find(filter_regr).toArray(function(err, result_regr) {
			data.prediction = {};
			data.entry = entry;
			data.regression = result_regr[0];
			data.regression_modes = config.tram_regression_modes;
			for (var mode in config.tram_regression_modes){
				data.prediction[mode] = data_regression_tram.doPrediction(stopA, stopB, entry, data.regression, mode);
			}
			res.render('main/tram_pred_sect', data);
		});
	}else{
		//Error
		res.render('main/tram_pred_sect', data);
	}
};

/**
 * Predict Section - Overall
 */

exports.tram_pred = function(req, res){
	var data = {
		title: "Travelling Time Prediction",
		querybox: tram_data_sect_querybox(),
		from_to_list: from_to_list,
	};
	res.render('main/tram_pred', data);
};

exports.tram_pred_result = function(req, res){
};