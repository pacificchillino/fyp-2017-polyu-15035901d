var config = require("../config.js");
var func = require("../func.js");
var func_tram_service = require("../func_tram_service.js");
var _ = require('underscore');

var searchbox = function(model){
	return {
		sections: global.tramSectionsList,
		models: global.prediction.getModels(),
	};
}

exports.tram_data_predictor_detail = function (req, res){
	var data = {
		title: "Trams: Prediction Model Details",
		searchbox: searchbox(),
	};
	res.render('main/tram_predictor_detail', data);
};

exports.tram_data_predictor_detail_result = function (req, res){
	var myModel = req.params.model;
	var sectCollection = "data_tram_" + req.params.stopA + "_" + req.params.stopB;
	var hours_start = config.tram_time_start;
	var hours_end = config.tram_time_end;
	var data = {
		title: "Trams: Prediction Model Details",
		searchbox: searchbox(),
		hours_start: hours_start,
		hours_end: (hours_end < hours_start) ? (hours_end + 24) : hours_end,
		hours_date_turnover: config.hour_date_turnover,
		params: req.params,
		query: req.query,
		result: global.prediction.getPredictorDetails(myModel, sectCollection),
	};
	res.render('main/tram_predictor_detail', data);
};