var config = require("./config.js");
var func = require("./func.js");
var _ = require('underscore');

var HongKongWeather = require('./include/hongkong-weather.js');
var weather = new HongKongWeather();

var weatherLastUpdate = "";		//Time of last weather update

exports.init = function(isDateTurnover){
	
};

exports.obtainWeather = function(){
	//Socket Message
	func.msg("Weather : Obtaining weather data",config.debug_color.weather);
	//Make new request
	weather.getCurrent().then(function(data){
		//Extract rainfall data
		var updated = data.regional.updated_on.toString();
		if (updated == weatherLastUpdate){
			//NO Updates
			//Socket Message
			func.msg("Weather : No updates yet",config.debug_color.weather);
		}else{
			//HAVE Updates
			weatherLastUpdate = updated;
			//Rainfall
			var rainfall = {};
			_.each(config.rainfall_recorded, function(place) {
				var index = _.findIndex(data.rainfall, {station: place});
				//No rainfall if index is -1
				rainfall[place] = (index == -1) ? 0 : func.getRainFallAmount(data.rainfall[index].mm);
			});
			//Insert to database
			var entry = {
				date: data.regional.updated_on,
				rainfall: rainfall,
				HKO_temp: parseInt(data.regional.degrees_c),
				HKO_hum: parseInt(data.regional.humidity_pct),
			};
			global.weather = entry;
			var filter = {date: data.regional.updated_on};
			if (global.db != null){
				if (func.isSavingDBAllowed()){
					//First prevent duplications
					var tableName = func.getTableName("data_weather_rainfall");
					global.db.collection(tableName).findOne(filter, function(err, result) {
						if (err) throw err;
						if (result == null){
							//No duplications --> insert to database
							global.db.collection(tableName).insertOne(entry,
								function(err, res) { if (err) throw err; }
							);
						}
					});
				}
			}
			//Socket Message
			func.msg("Weather : Weather data saved for " + config.rainfall_recorded.join(", "),config.debug_color.weather);
		}
	}).catch(console.error);
};