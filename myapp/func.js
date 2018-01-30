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
	return HH+":"+MM+"("+SS+")";
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
}

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
	}else if(!data.wkday){
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