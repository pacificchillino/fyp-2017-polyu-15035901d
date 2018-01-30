var config = require("../config.js");
var func = require("../func.js");

/**
 * Search Box
 */

var searchbox = function(model){
	var searchbox = {
		sections: [],
		models: global.prediction.getModels(),
		myModel: (model != null) ? global.prediction.getAModel(model) : null,
		modes: (model != null) ? global.prediction.getModes(model) : [],
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
					res.send(JSON.stringify(result));
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
						actual: result,
						predicted: predict_result,
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
						count: count,
					};
					res.render('main/tram_predict_exist', data);
				}
			});
		});
	}
};

//Get results optimized for charts
var result_for_charts = function(result){

};

/**
 * Misc
 */