var config = require("../config.js");
var func = require("../func.js");

/**
 * Tram
 */

var tram_query_limit = 500;
var tram_sortby = {
	"datea": {name: "Earliest to Most Recent", sort: {date: +1, hours: +1}},
	"dated": {name: "Most Recent to Earliest", sort: {date: -1, hours: -1}},
	"minsa": {name: "Fastest to Slowest", sort: {tt_mins: +1}},
	"minsd": {name: "Slowest to Fastest", sort: {tt_mins: -1}},
};

/**
 * Tram Raw Data - Search Box only
 */

function tram_data_searchbox(){
	var searchbox = {
		sections: [],
		sortby: tram_sortby,
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
		title: "Raw Data of Tram Travelling Time",
		searchbox: tram_data_searchbox(),
	};
	res.render('main/tram_data', data);
};

/**
 * Tram Raw Data - With Result
 */

exports.tram_data_result = function(req, res){
	tram_data_result_2(req, res, false);
};

exports.tram_data_result_api = function(req, res){
	tram_data_result_2(req, res, false);
};

tram_data_result_2 = function (req, res, isAPI){
	/**
	 * Params: stopA, stopB
	 * Query: sortby, wkday, dow, date_gt, date_lt, hours_gt, hours_lt
	 */
	//Table
	var db_table = "data_tram_" + req.params.stopA + "_" + req.params.stopB;
	//Filter
	var filter = {};
	if (req.query.wkday != null) filter.wkday = (req.query.wkday == "1") ? true : false;
	if (req.query.dow != null) filter.dayOfWk = parseInt(req.query.dow);
	if (req.query.date_gt != null || req.query.date_lt != null){
		filter.date = {};
		if (req.query.date_gt != null) filter.date.$gt = req.query.date_gt;
		if (req.query.date_lt != null) filter.date.$lt = req.query.date_lt;
	}
	if (req.query.hours_gt != null || req.query.hours_lt != null){
		filter.hours = {};
		if (req.query.hours_gt != null) filter.hours.$gt = hours(req.query.hours_gt);
		if (req.query.hours_lt != null) filter.hours.$lt = hours(req.query.hours_lt);
	}
	//Sort
	var sort = {};
	if (req.query.sortby != null){
		if (tram_sortby[req.query.sortby] != null){
			sort = tram_sortby[req.query.sortby].sort;
		}
	}
	//Select from DB
	if (global.db != null){
		global.db.collection(db_table).find(filter).sort(sort).limit(tram_query_limit).toArray(function(err, result) {
			if (err) throw err;
			global.db.collection(db_table).find(filter).count(function(err, count){
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
					//Data
					var data = {
						title: "Raw Data of Tram Travelling Time",
						searchbox: tram_data_searchbox(),
						params: req.params,
						query: req.query,
						result: result,
						count: count,
						limit: tram_query_limit,
					};
					res.render('main/tram_data', data);
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