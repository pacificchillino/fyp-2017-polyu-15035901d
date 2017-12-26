/**
 * Updated variables:
 * global.dayType (WK, SA, PH)
 * global.dayOfWeek
 * global.dateStr
 * global.isWeekday
 * global.exceptionHourStart
 * global.exceptionHourEnd
 */

var config = require("./config.js");
var func = require("./func.js");

exports.getToday = function(){
	var shift = config.hour_date_turnover * 3600 * 1000;
	var today = new Date(new Date().getTime() - shift);
	var YYYY = today.getFullYear().toString();
	var MM = func.ten(today.getMonth() + 1);
	var DD = func.ten(today.getDate());
	var day = today.getDay();
	global.dayOfWeek = day;
	var str = YYYY+"/"+MM+"/"+DD;
	global.dateStr = str;
	//Obtain from days_public_holidays
	global.db.collection("days_public_holidays").findOne({"yy": YYYY, "mm": MM, "dd": DD}, function(err, result) {
		if (err) throw err;
		//Sunday
		if (day == 0){
			global.dayType = "PH";
			global.isWeekday = false;
			global.isPH = true;
		}
		//Saturday
		else if (day == 6){
			global.dayType = "SA";
			global.isWeekday = false;
			global.isPH = false;
		}
		//Weekday
		else{
			global.dayType = "WK";
			global.isWeekday = true;
			global.isPH = false;
		}
		//Public Holiday
		if (result != null){
			global.dayType = "PH";
			global.isWeekday = false;
			global.isPH = true;
		}
	});
	//Obtain from days_exceptions
	global.db.collection("days_exceptions").findOne({"date": str}, function(err, result) {
		if (err) throw err;
		if (result == null){
			global.exceptionHourStart = -1;
			global.exceptionHourEnd = -1;
		}else{
			var from = result.from.split(":");
			var to = result.to.split(":");
			global.exceptionHourStart = parseInt(from[0]) + parseInt(from[1]) / 60;
			global.exceptionHourEnd = parseInt(to[0]) + parseInt(to[1]) / 60;
		}
	});
};