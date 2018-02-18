var config = require("../config.js");
var func = require("../func.js");

/**
 * Search Box
 */

var searchbox = function(model){
	return {
		sections: func.getTramSectionsList(),
		models: global.prediction.getModels(),
		myModel: (model != null) ? global.prediction.getAModel(model) : null,
		modes: (model != null) ? global.prediction.getModes(model) : [],
	};
}

/**
 * View Tram Raw Data - Search Box only
 */

exports.tram_data = function(req, res){
	var data = {
		title: "Trams: View Raw Data of Travelling Time",
		searchbox: searchbox(),
	};
	res.render('main/tram_view_data', data);
};

/**
 * View Tram Raw Data - Results
 */

var tram_data_result = function(req, res, isAPI){
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
					res.send(JSON.stringify({result: result}));
				}else{
					//Manipulate result
					for (var i in result){
						result[i].starting = func.getHMSByHours(result[i].hours);
						result[i].minsSpent = result[i].tt_mins.toFixed(2);
						result[i].rainfall = result[i].rainfall.toFixed(2);
						result[i].ending = func.getHMSByHours(result[i].hours + result[i].tt_mins / 60);
					}
					var dateNow = new Date(req.params.yy-0, req.params.mm-1, req.params.dd-0);
					var datePrev = new Date(dateNow);
					datePrev.setDate(dateNow.getDate() - 1);
					var dateNext = new Date(dateNow);
					dateNext.setDate(dateNow.getDate() + 1);
					//Data
					var data = {
						title: "Trams: View Raw Data of Travelling Time",
						searchbox: searchbox(),
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

exports.tram_data_result = function(req, res){
	tram_data_result(req, res, false);
};

exports.tram_data_result_api = function(req, res){
	tram_data_result(req, res, true);
};

/**
 * Prediction with Existing Data - Search Box only
 */

exports.tram_data_predict_exist = function(req, res){
	var data = {
		title: "Trams: Travelling Time Prediction with Existing Data",
		searchbox: searchbox(),
	};
	res.render('main/tram_predict_exist', data);
};

/**
 * Prediction with Existing Data - Results
 */

exports.tram_data_predict_exist_result = function(req, res){
	tram_data_predict_exist_result(req, res, false);
};

exports.tram_data_predict_exist_result_api = function(req, res){
	tram_data_predict_exist_result(req, res, true);
};

var tram_data_predict_exist_result = function (req, res, isAPI){
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
				//Get prediction result
				var sectCollection = db_table;
				var model = req.params.model;
				var modes = global.prediction.getModes(model);
				var predict_result = {};
				for (var i in modes){
					myMode = modes[i].id;
					predict_result[myMode] = global.prediction.predict(sectCollection, model, myMode, result);
				}
				if (isAPI){
					//Return API
					res.send({
						result:{
							actual: result,
							predicted: predict_result,
						},
					});
				}else{
					//Prev and Next Date
					var dateNow = new Date(req.params.yy-0, req.params.mm-1, req.params.dd-0);
					var datePrev = new Date(dateNow);
					datePrev.setDate(dateNow.getDate() - 1);
					var dateNext = new Date(dateNow);
					dateNext.setDate(dateNow.getDate() + 1);
					//Manipulate result
					for (var i in result){
						result[i].starting = func.getHMSByHours(result[i].hours);
						result[i].starting_normalized = (result[i].hours / 24).toFixed(4);
						result[i].minsSpent = result[i].tt_mins.toFixed(2);
						result[i].rainfall = result[i].rainfall.toFixed(2);
						result[i].ending = func.getHMSByHours(result[i].hours + result[i].tt_mins / 60);
					}
					//Data
					var data = {
						title: "Trams: Travelling Time Prediction with Existing Data",
						searchbox: searchbox(model),
						date_prev: func.getYYYYMMDD(datePrev),
						date_next: func.getYYYYMMDD(dateNext),
						params: req.params,
						query: req.query,
						actual: result,
						predicted: predict_result,
						data_for_chart: JSON.stringify(result_for_time_chart(modes, result, predict_result)),
						count: count,
					};
					res.render('main/tram_predict_exist', data);
				}
			});
		});
	}
};

/**
 * For Charting
 */

var result_for_time_chart = function(modeList, actual, predicted){
	var data = {
		modes: [],
		actual: [],
		predicted: {},
	};
	//For each mode
	for (var i in modeList){
		var mode = modeList[i].id;
		data.modes.push(mode);
		data.predicted[mode] = [];
		for (var j in predicted[mode].predicted){
			//Only obtain data with predictions
			if (predicted[mode].predicted[j] != null){
				data.predicted[mode].push({
					x: actual[j].hours.toFixed(4) -0,
					y: predicted[mode].predicted[j].toFixed(3) -0,
				});
			}
		}
	};
	//For actual
	for (var j in actual){
		data.actual.push({
			x: actual[j].hours.toFixed(4) -0,
			y: actual[j].tt_mins.toFixed(3) -0,
		});
	}
	return data;
};

/**
 * Prediction with Existing Data (Weekly) - Search Box only
 */

exports.tram_data_predict_week = function(req, res){
	var data = {
		title: "Trams: Travelling Time Prediction Error Summary with Weekly Data",
		searchbox: searchbox(),
	};
	res.render('main/tram_predict_week', data);
};

/**
 * Prediction with Existing Data (Weekly) - Results
 */

exports.tram_data_predict_week_result = function(req, res){
	tram_data_predict_week_result(req, res, false);
};

exports.tram_data_predict_week_result_api = function(req, res){
	tram_data_predict_week_result(req, res, true);
};

var tram_data_predict_week_result = function (req, res, isAPI){
	//Get list of dates
	var yy = req.params.yy - 0;
	var mm = req.params.mm - 1;
	var dd = req.params.dd - 0;
	if (!isNaN(yy) && !isNaN(mm) && !isNaN(dd)){
		//Valid Dates
		var firstDay = func.getYYYYMMDD(new Date(yy, mm, dd - 6));
		var lastDay = func.getYYYYMMDD(new Date(yy, mm, dd));
	}else{
		//Invalid Dates
		var firstDay = "0000/00/00";
		var lastDay = "0000/00/00";
	}
	//Table
	var db_table = "data_tram_" + req.params.stopA + "_" + req.params.stopB;
	//Filter
	var filter = { date: { $gte: firstDay, $lte: lastDay } };
	//Select from DB
	if (global.db != null){
		global.db.collection(db_table).find(filter).toArray(function(err, result) {
			if (err) throw err;
			//Get prediction result
			var sectCollection = db_table;
			var model = req.params.model;
			var modes = global.prediction.getModes(model);
			var summary = {};
			for (var i in modes){
				myMode = modes[i].id;
				summary[myMode] = global.prediction.predictionErrorSummaryByDate(sectCollection, model, myMode, result);
			}
			if (isAPI){
				//Return API
				res.send(summary);
			}else{
				//Render
				var data = {
					title: "Trams: Travelling Time Prediction Error Summary with Weekly Data",
					searchbox: searchbox(model),
					params: req.params,
					query: req.query,
					firstDay: firstDay,
					lastDay: lastDay,
					summary: summary,
					count: result.length,
				};
				res.render('main/tram_predict_week', data);
			}
		});
	}
};