var config = require("../config.js");
var func = require("../func.js");
var data_regression_tram = require("../data_regression_tram.js");

/**
 * Tram Raw Data - Search Box only
 */

function tram_data_searchbox(){
	var searchbox = {
		sections: [],
	};
	for (var i in config.tram_est_sections){
		var from = config.tram_est_sections[i].from.split("_")[0];
		var to = config.tram_est_sections[i].to.split("_")[0];
		searchbox.sections.push({
			from_to: from + "/" + to,
			caption: from + " to " + to + " (" + config.tram_stops_for_eta[config.tram_est_sections[i].from].name + " to " + config.tram_stops_for_eta[config.tram_est_sections[i].to].name + ")",
		});
	}
	return searchbox;
}

exports.tram_data = function(req, res){
	var data = {
		title: "View Raw Data of Tram Travelling Time",
		searchbox: tram_data_searchbox(),
	};
	res.render('main/tram_view_data', data);
};

/**
 * Tram Data Regression Test - Search Box only
 */

exports.tram_data_regr = function(req, res){
	var data = {
		title: "Travelling Time Prediction with Existing Data",
		searchbox: tram_data_searchbox(),
	};
	res.render('main/tram_regr_data', data);
};

/**
 * Tram Raw Data - With Result
 */

exports.tram_data_result = function(req, res){
	tram_data_result_2(req, res, false);
};

exports.tram_data_result_api = function(req, res){
	tram_data_result_2(req, res, true);
};

tram_data_result_2 = function (req, res, isAPI){
	/**
	 * Params: stopA, stopB, yy, mm, dd
	 */
	//Table
	var db_table = "data_tram_" + req.params.stopA + "_" + req.params.stopB;
	//Filter
	var filter = {
		date: req.params.yy + "/" + req.params.mm + "/" + req.params.dd,
	};
	//Select from DB
	if (global.db != null){
		global.db.collection(db_table).find(filter).toArray(function(err, result) {
			if (err) throw err;
			global.db.collection(db_table).find(filter).count(function(err, count){
				if (err) throw err;
				if (isAPI){
					//Return API
					res.send(JSON.stringify(result));
				}else{
					//Manipulate result
					for (var i in result){
						result[i].starting = HHMMSS(result[i].hours);
						result[i].minsSpent = result[i].tt_mins.toFixed(2);
						result[i].ending = HHMMSS(result[i].hours + result[i].tt_mins / 60);
					}
					var dateNow = new Date(req.params.yy-0, req.params.mm-1, req.params.dd-0);
					var datePrev = new Date(dateNow);
					datePrev.setDate(dateNow.getDate() - 1);
					var dateNext = new Date(dateNow);
					dateNext.setDate(dateNow.getDate() + 1);
					//Data
					var data = {
						title: "Prediction with Existing Tram Data",
						searchbox: tram_data_searchbox(),
						date_prev: func.getYYYYMMDD(datePrev),
						date_next: func.getYYYYMMDD(dateNext),
						params: req.params,
						query: req.query,
						result: result,
						count: count,
					};
					res.render('main/tram_view_data', data);
				}
			});
		});
	}
};

/**
 * Tram Data Regression Test - Results
 */

exports.tram_data_regr_result = function(req, res){
	tram_data_regr_result_2(req, res, false);
};

exports.tram_data_regr_result_api = function(req, res){
	tram_data_regr_result_2(req, res, true);
};

tram_data_regr_result_2 = function (req, res, isAPI){
	/**
	 * Params: stopA, stopB, yy, mm, dd
	 */
	//Stops
	var stopA = req.params.stopA;
	var stopB = req.params.stopB;
	var db_stop = "data_tram_" + stopA + "_" + stopB;
	var db_regr = "regression_tram";
	//Table
	var db_table = "data_tram_" + stopA + "_" + stopB;
	//Filter
	var filter_stop = { date: req.params.yy + "/" + req.params.mm + "/" + req.params.dd };
	var filter_regr = { stopA: stopA, stopB: stopB };
	//Select from DB
	if (global.db != null){
		global.db.collection(db_stop).find(filter_stop).toArray(function(err, result) {
			global.db.collection(db_regr).find(filter_regr).toArray(function(err, result_regr) {
				if (err) throw err;
				for (var i in result){
					result[i].prediction = {};
					for (var mode in config.tram_regression_modes){
						result[i].prediction[mode] = data_regression_tram.doPrediction(stopA, stopB, result[i], result_regr[0], mode);
					}
				}
				//Output
				if (isAPI){
					//Return API
					res.send(JSON.stringify(result));
				}else{
					//Manipulate result & Calculate Error
					var error_count = {};
					var error_total = {};
					var error_worst_2d = {};
					for (var mode in config.tram_regression_modes){
						error_count[mode] = 0;
						error_total[mode] = 0;
						error_worst_2d[mode] = 0;
					}
					for (var i in result){
						result[i].starting = HHMMSS(result[i].hours);
						result[i].starting_n = (result[i].hours / 24).toFixed(4);
						result[i].minsSpent = result[i].tt_mins.toFixed(2);
						result[i].prediction_2d = {};
						result[i].prediction_error_2d = {};
						for (var mode in config.tram_regression_modes){
							var prediction = result[i].prediction[mode];
							if (prediction == null){
								result[i].prediction_2d[mode] = "";
								result[i].prediction_error_2d[mode] = "";
							}else{
								result[i].prediction_2d[mode] = result[i].prediction[mode].toFixed(2);
								var myError = Math.abs(result[i].tt_mins - prediction);
								result[i].prediction_error_2d[mode] = myError.toFixed(2);
								error_worst_2d[mode] = Math.max(error_worst_2d[mode], myError);
								error_count[mode]++;
								error_total[mode]+= myError;
							}
						}
					}
					var error_avg_2d = {};
					var mode_count = 0;
					for (var mode in config.tram_regression_modes){
						mode_count++;
						error_avg_2d[mode] = (error_total[mode] / error_count[mode]).toFixed(2);
						error_worst_2d[mode] = error_worst_2d[mode].toFixed(2);
						if (isNaN(error_avg_2d[mode])){
							error_avg_2d[mode] = "";
							error_worst_2d[mode] = "";
						}
					}
					//Date
					var dateNow = new Date(req.params.yy-0, req.params.mm-1, req.params.dd-0);
					var datePrev = new Date(dateNow);
					datePrev.setDate(dateNow.getDate() - 1);
					var dateNext = new Date(dateNow);
					dateNext.setDate(dateNow.getDate() + 1);
					//Data
					var data = {
						title: "Prediction with Existing Tram Data",
						searchbox: tram_data_searchbox(),
						date_prev: func.getYYYYMMDD(datePrev),
						date_next: func.getYYYYMMDD(dateNext),
						params: req.params,
						query: req.query,
						result: result,
						error_avg: error_avg_2d,
						error_worst: error_worst_2d,
						mode_count: mode_count,
					};
					res.render('main/tram_regr_data', data);
				}
			});
		});
	}
};

/**
 * Misc
 */

//Convert from HH:MM to hours in decimal
function hours(HHMM){
	var splitup = HHMM.split(":");
	return parseInt(splitup[0]) + parseInt(splitup[1])/60;
}

//Convert from decimal to HH:MM
function HHMMSS(hours){
	var HH = func.ten(Math.floor(hours) % 24);
	var MM = func.ten(Math.floor((hours * 60)) % 60);
	var SS = func.ten(Math.floor((hours * 3600)) % 60);
	return HH+":"+MM+"("+SS+")";
}