var config = require("./config.js");

/**
 * Emit socket data for debug
 */
exports.msg = function(message, color){
	if (color == null) color = "black"; //Defalt color
	if (global.io != null){
		var data = {
			message: message,
			color: color,
			date: exports.getHMSmsOfDay(new Date()),
		};
		global.io.emit('msg', data);
	}
	console.log(message);
};

exports.msg2 = function(message, message2, color){
	if (color == null) color = "black"; //Defalt color
	if (global.io != null){
		var data = {
			message: message,
			message2: message2,
			color: color,
			date: exports.getHMSmsOfDay(new Date()),
		};
		global.io.emit('msg2', data);
	}
	console.log(message);
}

/**
 * Get working database table: for remote computer, use test tables only
 */

var db_table_initial = (process.platform == "win32") ? "test_" : "";
exports.getTableName = function(name){
	return db_table_initial + name;
}

if (process.platform == "win32"){
	var _isSavingDBAllowed = !config.disable_test_db;
}else{
	var _isSavingDBAllowed = true;
}
exports.isSavingDBAllowed = function(){
	return _isSavingDBAllowed;
}

/**
 * Get MongoDB url
 */
exports.getMongoURL = function(){
	var url = (process.platform == "win32") ? config.mongo_url_foreign : config.mongo_url_local;
	return "mongodb://"+config.mongo_user+":"+config.mongo_pwd+"@"+url+"/"+config.mongo_db+"?authSource="+config.mongo_auth;
};

/**
 * Get time
 */
exports.getHMOfDay = function(date){ //HH:MM , where HH < 24
	if (date == null) date = new Date();
	var HH = date.getHours();
	var MM = date.getMinutes();
	return ten(HH) + ":" + ten(MM);
};
exports.getHMSOfDay = function(date){ //HH:MM:SS , where HH < 24
	if (date == null) date = new Date();
	var HH = date.getHours();
	var MM = date.getMinutes();
	var SS = date.getSeconds();
	return ten(HH) + ":" + ten(MM) + ":" + ten(SS);
};

exports.getHMSByHours = function(hours){
	var HH = ten(Math.floor(hours) % 24);
	var MM = ten(Math.floor((hours * 60)) % 60);
	var SS = ten(Math.floor((hours * 3600)) % 60);
	return HH+":"+MM+":"+SS;
};

exports.getHMByHours = function(hours){
	var HH = ten(Math.floor(hours) % 24);
	var MM = ten(Math.floor((hours * 60)) % 60);
	return HH+":"+MM;
};

exports.getHMSmsOfDay = function(date){ //HH:MM:SS.000 , where HH < 24
	if (date == null) date = new Date();
	var ms = date.getTime().toString();
	ms = ms.substr(ms.length - 3);
	return exports.getHMSOfDay(date)+"."+ms;
};

exports.getHoursByHM = function(str){
	var splitup = HHMM.split(":");
	return parseInt(splitup[0]) + parseInt(splitup[1])/60;
};

exports.getHours = function($str){
	var str = "";
	var isPlainNumber = true;
	for (var i = 0; i < $str.length; i++){
		var c = $str.charAt(i);
		if (c >= "0" && c <= "9"){
			str = str + c;
		}else if (c != "."){
			isPlainNumber = false;
		}
	}
	if (isPlainNumber){
		var parsed = $str - 0;
		return (isNaN(parsed)) ? null : parsed;
	}else{
		switch(str.length){
			case 0: //empty
			return null;
			break;
			case 1: //h
			return parseInt(str);
			break;
			case 2: //hh
			return parseInt(str);
			break;
			case 3: //hmm
			return parseInt(str.charAt(0)) + parseInt(str.charAt(1) + str.charAt(2)) / 60;
			break;
			case 4: //hhmm
			return parseInt(str.charAt(0) + str.charAt(1)) + parseInt(str.charAt(2) + str.charAt(3)) / 60;
			break;
			case 5: //hmmss
			return parseInt(str.charAt(0)) + parseInt(str.charAt(1) + str.charAt(2)) / 60 + parseInt(str.charAt(3) + str.charAt(4)) / 3600;
			break;
			default: //hhmmss
			return (parseInt(str.charAt(0) + str.charAt(1)) + parseInt(str.charAt(2) + str.charAt(3)) / 60 + parseInt(str.charAt(4) + str.charAt(5)) / 3600) % 86400;
			break;
		}
	}
};

exports.isDuringTramRecordingTimeA = function(date){ //Tram: Starting of section
	if (date == null) date = new Date();
	var hours = date.getHours() + date.getMinutes()/60 + date.getSeconds()/3600;
	var starting = config.tram_time_start;
	var ending = config.tram_time_end;
	if (hours < config.hour_date_turnover) hours += 24;
	if (ending < config.hour_date_turnover) ending += 24;
	if (exports.isDuringExceptionTime()) return false;
	return (hours >= starting && hours < ending);
};

exports.isDuringTramRecordingTimeB = function(date){ //Tram: Ending of section
	if (date == null) date = new Date();
	var hours = date.getHours() + date.getMinutes()/60 + date.getSeconds()/3600;
	var starting = config.tram_time_start;
	var cutoff = config.tram_time_cutoff;
	if (hours < config.hour_date_turnover) hours += 24;
	if (cutoff < config.hour_date_turnover) cutoff += 24;
	if (exports.isDuringExceptionTime()) return false;
	return (hours >= starting && hours < cutoff);
};

exports.isDuringExceptionTime = function(date){ //During exception time of marking
	if (date == null) date = new Date();
	var hours = date.getHours() + date.getMinutes()/60 + date.getSeconds()/3600;
	if (global.exceptionHourStart != null && global.exceptionHourEnd != null){
		var starting = global.exceptionHourStart;
		var ending = global.exceptionHourEnd;
		if (hours < config.hour_date_turnover) hours += 24;
		if (ending < config.hour_date_turnover && ending >= 0) ending += 24; //For nil, it is -1
		return (hours >= starting && hours < ending);
	}else{
		return true;
	}
}

/**
 * Get Date
 */

exports.getYYYYMMDD = function(date){ //YYYY/MM/DD
	if (date == null) date = new Date();
	var YYYY = date.getFullYear();
	var MM = ten(1+date.getMonth());
	var DD = ten(date.getDate());
	return YYYY + "/" + MM + "/" + DD;
};

/**
 * Weather
 */

exports.getRainFallAmount = function(str){ //For "x to y", consider as (x+y)/2
	var rainfall = str.split(" to ");
	if (rainfall.length == 1){
		var number = parseInt(rainfall[0]);
		if (! isNaN(number)){
			return number;
		}else{
			return null;
		}
	}else{
		return (parseInt(rainfall[0]) + parseInt(rainfall[1])) / 2;
	}
};

exports.isDuringWeatherRecordingTime = function(date){
	if (date == null) date = new Date();
	var hours = date.getHours() + date.getMinutes()/60 + date.getSeconds()/3600;
	var starting = config.weather_time_start;
	var ending = config.weather_time_end;
	if (hours < config.hour_date_turnover) hours += 24;
	if (ending < config.hour_date_turnover) ending += 24;
	if (exports.isDuringExceptionTime()) return false;
	return (hours >= starting && hours < ending);
};

/** 
 * Day Classifications
 */

exports.getDayClassByWeekdayOrNot = function(data){
	if (data.PH == true){
		return "w0";
	}else if(data.dayOfWk != 6 && data.dayOfWk != 0){
		return "w0";
	}else{
		return "w1";
	}
};

exports.dayClassListByWeekdayOrNot = ["w0", "w1"];

exports.getDayClassByDayOfWeek = function(data){
	if (data.PH == true){
		return "d0";
	}else{
		return "d" + data.dayOfWk;
	}
};

exports.dayClassListByDayOfWeek = ["d0", "d1", "d2", "d3", "d4", "d5", "d6"];

exports.getDayClass = function(data, isDayOfWeek){
	if (isDayOfWeek){
		return exports.getDayClassByDayOfWeek(data);
	}else{
		return exports.getDayClassByWeekdayOrNot(data);
	}
}

exports.getDayClassList = function(isDayOfWeek){
	if (isDayOfWeek){
		return exports.dayClassListByWeekdayOrNot;
	}else{
		return exports.dayClassListByDayOfWeek;
	}
}

/**
 * Misc
 */

exports.ten = function(number){
	if (number < 10){
		return "0" + number;
	}else{
		return "" + number;
	}
};

ten = exports.ten;

/**
 * Trams
 */

var tramSectionsList;

exports.getTramSectionsList = function(){
	if (tramSectionsList == null){
		var arr = [];
		for (var i in config.tram_est_sections){
			var _obj = config.tram_est_sections[i];
			var from = (_obj.from_alt != null) ? _obj.from_alt : _obj.from;
			var to = (_obj.to_alt != null) ? _obj.to_alt : _obj.to;
			arr.push({
				from: from,
				to: to,
				from_to: from + "/" + to,
				from_name: config.tram_stops_for_eta[config.tram_est_sections[i].from].name,
				to_name: config.tram_stops_for_eta[config.tram_est_sections[i].to].name,
				caption: from + " to " + to + " (" + config.tram_stops_for_eta[config.tram_est_sections[i].from].name + " to " + config.tram_stops_for_eta[config.tram_est_sections[i].to].name + ")",
			});
		}
		tramSectionsList = arr;
	}
	return tramSectionsList;
};

var tramPredictionServiceFromToList;

exports.getTramPredictionServiceFromToList = function(){
	//Do only when the list is empty
	if (tramPredictionServiceFromToList == null){
		tramPredictionServiceFromToList = {};
		//Function to add item to array
		var addToList = function(viaStops){
			//Obtain section
			var stopA = viaStops[0];
			var stopB = viaStops[viaStops.length - 1];
			var isMulti = (viaStops.length == 2) ? 0 : 1;
			//Get Name & Direction of stop A
			var stopNameA = config.tram_stops_for_eta[stopA].name;
			var stopNameB = config.tram_stops_for_eta[stopB].name;
			var directionA = config.tram_stops_for_eta[stopA].direction;
			var directionB = config.tram_stops_for_eta[stopB].direction;
			//Add to array
			if (tramPredictionServiceFromToList[stopA] == null){
				tramPredictionServiceFromToList[stopA] = {
					name: stopNameA,
					direction: directionA,
					to: {},
				};
			}
			if (tramPredictionServiceFromToList[stopA].to[stopB] == null){
				tramPredictionServiceFromToList[stopA].to[stopB] = {
					name: stopNameB,
					direction: directionB,
				};
			}
			if (tramPredictionServiceFromToList[stopA].to[stopB][isMulti] == null){
				tramPredictionServiceFromToList[stopA].to[stopB][isMulti] = viaStops;
			}
		};
		//Read tram_prediction_from_to
		for (var i in config.tram_prediction_from_to){
			var entry = config.tram_prediction_from_to[i];
			//Type 1: between
			if (entry.between){
				for (var j = 0; j < entry.between.length - 1; j++){
					for (var k = j+1; k < entry.between.length; k++){
						addToList(entry.between.slice(j, k+1));
					}
				}
			}
			//Type 2: from, to
			else{
				for (var j = 0; j < entry.from.length; j++){
					for (var k = 0; k < entry.to.length; k++){
						var arr1 = entry.from.slice(j);
						var arr2 = entry.to.slice(0, k+1);
						addToList(arr1.concat(arr2));
					}
				}
			}
		}
	}
	return tramPredictionServiceFromToList;
};

exports.getTramPredictionServiceFromList = function(){
	exports.getTramPredictionServiceFromToList(); //Initialize if in need
	var list = {};
	for (var i in tramPredictionServiceFromToList){
		list[i] = {
			name: tramPredictionServiceFromToList[i].name,
			direction: tramPredictionServiceFromToList[i].direction,
		};
	}
	return list;
};

exports.getTramPredictionServiceToList = function(from){
	exports.getTramPredictionServiceFromToList(); //Initialize if in need
	if (tramPredictionServiceFromToList[from] == null){
		return {};
	}else{
		return tramPredictionServiceFromToList[from].to;
	}
};

exports.getTramPredictionServiceFromToSections = function(from, to, multi){
	exports.getTramPredictionServiceFromToList(); //Initialize if in need
	if (tramPredictionServiceFromToList[from] == null){
		return [];
	}else if (tramPredictionServiceFromToList[from].to[to] == null){
		return [];
	}else if (tramPredictionServiceFromToList[from].to[to][multi] == null){
		return [];
	}else{
		return tramPredictionServiceFromToList[from].to[to][multi];
	}
};

exports.getRainfallByTramSection = function(stopA, stopB){ //HVT not HVT_B
	//Get rainfall weightings
	var weightings = [];
	for (var i in config.tram_est_sections){
		if (config.tram_est_sections[i].from.split("_")[0] == stopA){
			if (config.tram_est_sections[i].to.split("_")[0] == stopB){
				weightings = config.tram_est_sections[i].rainfall;
			}
		}
	}
	var sum = 0;
	for (var i in weightings){
		if (global.weather.rainfall[weightings[i].district] != null){
			sum += global.weather.rainfall[weightings[i].district] * weightings[i].weight;
		}
	}
	return sum;
};