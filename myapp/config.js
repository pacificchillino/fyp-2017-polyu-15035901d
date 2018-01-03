/**
 * MongoDB settings
 */
exports.mongo_user = "fyp";								//User
exports.mongo_pwd = "HuYv77bq5i";						//Password
exports.mongo_url_foreign = "188.166.180.107:27017";	//Connection from remote server
exports.mongo_url_local = "localhost:27017";			//Connection from local host
exports.mongo_auth = "admin";							//Database for authentication
exports.mongo_db = "ptdata";							//Database for working

/**
 * Debug settings
 */

exports.disable_test_db = true; //No saving data into test tables when using local computer

exports.debug_color = {
	hour: "blue",
	bus: "#900",
	tram: "#0C0",
	tram2: "#060",
	weather: "gold",
	error: "red",
};

/**
 * Time settings
 */
exports.hour_date_turnover = 3;//hours						//Before 3am, it is considered as the previous day
exports.cron_time_date_turnover = "0 3 * * *";				//3am, as mentioned above
exports.timezone = 8;

/**
 * Weather settings
 */
const $CW = "Central & Western District";
const $WC = "Wan Chai";
const $EA = "Eastern District";
exports.rainfall_recorded = [$CW, $WC, $EA];
exports.cron_time_weather_obtain = "30 * * * * *";				//Obtain weather data at 30th second of each minute
exports.weather_time_start = 5.5;//hours						//Omit weather recordings beginning before 5:30am
exports.cron_time_weather_start = "15 5 * * *";
exports.weather_time_end = 0;//hours							//Omit weather recordings beginning after 12:00am
exports.cron_time_weather_end = "15 0 * * *";

/**
 * Tram settings
 */
exports.tram_time_start = 6;//hours								//Omit time recordings beginning before 6am
exports.cron_time_tram_start = "0 6 * * *";
exports.tram_time_end = 0;//hours								//Omit time recordings beginning after 12am
exports.cron_time_tram_end = "0 0 * * *";
exports.tram_time_cutoff = 1.5;//hours							//Discard recordings which are unable to end before 1:30am
exports.cron_time_tram_cutoff = "30 1 * * *";
exports.tram_eta_threshold = 60;//mins							//If the obtained ETA is over 60 mins (or under -60 mins), omit it
exports.tram_eta_nonarrived_limit = 120;//secs					//For determination of arrival time by non-arrived ETA, it must be less than 120 seconds
exports.cron_time_tram_get_eta = "0 * * * * *";					//Get ETA for all every minute
exports.cron_time_tram_get_eta2 = "10,20,30,40,50 * * * * *";	//Get ETA for isTerminus: true every 10 seconds (except @min)
exports.cron_time_tram_get_em = "5 */3 * * * *";				//Get emergency message every 3 minutes
exports.cron_time_tram_clean_data = "30 2 * * *";				//Clean data at 2:30am
exports.cron_time_tram_update_regression = "0 3 * * *";			//Update regression variables at 3am

//Stops that ETA data are required
exports.tram_stops_for_eta = {
	"KTT": {isTerminus: true, name: "Kennedy Town"},
	"07E": {isTerminus: false, name: "Hill Road, Shek Tong Tsui"},
	"WMT": {isTerminus: true, name: "Western Market, Sheung Wan"},
	"19E": {isTerminus: false, name: "Macau Ferry, Sheung Wan"},
	"27E": {isTerminus: false, name: "Pedder Street, Central"},
	"33E": {isTerminus: false, name: "Murray Street, Central"},
	"35E": {isTerminus: false, name: "Admiralty Station"},
	"37E": {isTerminus: false, name: "Arsenal Street, Wan Chai"},
	"49E": {isTerminus: false, name: "Canal Road, Causeway Bay"},
	"HVT_B": {isTerminus: true, name: "Happy Valley"}, //To Shau Kei Wan
	"HVT_K": {isTerminus: false, name: "Happy Valley"}, //To Kennedy Town
	"57E": {isTerminus: false, name: "Victoria Park"},
	"69E": {isTerminus: false, name: "North Point Road"},
	"81E": {isTerminus: false, name: "Finnie Street, Quarry Bay"},
	"87E": {isTerminus: false, name: "Kornhill, Tai Koo"},
	"93E": {isTerminus: false, name: "Tai On Street, Sai Wan Ho"},
	"SKT": {isTerminus: false, name: "Shau Kei Wan"},
};

//Combined from/to available for prediction service
exports.tram_prediction_from_to = [
	{between: ["KTT","07E","19E","27E","35E","49E","57E","69E","81E","87E","93E","SKT"]},
	{from: ["KTT","07E","19E","27E","35E","49E"], to: ["HVT_B"]},
	{from: ["HVT_B"], to: ["49E","57E","69E","81E","87E","93E","SKT"]},
	{from: ["WMT"], to: ["SKT"]},
	{from: ["KTT"], to: ["HVT_B"]},
	{from: ["HVT_B"], to: ["SKT"]},
];

exports.tram_prediction_options = ["KTT","07E","WMT","19E","27E","35E","49E","HVT_B","57E","69E","81E","87E","93E","SKT"];

//Sections to be recorded
exports.tram_est_sections = [
	//Main Sections
	{from: "KTT", to: "07E",
		rainfall: [{district: $CW, weight: 1}],
		dest: ["WM","HVT_B","HVT_K","CBT","NPT","ED","SKT"],
		time_upper_limit: 60, time_lower_limit: 1,
	},
	{from: "07E", to: "19E",
		rainfall: [{district: $CW, weight: 1}],
		dest: ["WM","HVT_B","HVT_K","CBT","NPT","ED","SKT"],
		time_upper_limit: 60, time_lower_limit: 1,
	},
	{from: "19E", to: "27E",
		rainfall: [{district: $CW, weight: 1}],
		dest: ["HVT_B","HVT_K","CBT","NPT","ED","SKT"],
		time_upper_limit: 60, time_lower_limit: 1,
	},
	{from: "27E", to: "35E",
		rainfall: [{district: $CW, weight: 1}],
		dest: ["HVT_B","HVT_K","CBT","NPT","ED","SKT"],
		time_upper_limit: 60, time_lower_limit: 1,
	},
	{from: "35E", to: "49E",
		rainfall: [{district: $CW, weight: 0.2},{district: $WC, weight: 0.8}],
		dest: ["HVT_B","HVT_K","CBT","NPT","ED","SKT"],
		time_upper_limit: 60, time_lower_limit: 1,
	},
	{from: "49E", to: "HVT_B", to2: "HVT_K",
		rainfall: [{district: $WC, weight: 1}],
		dest: ["HVT_B","HVT_K"],
		notVia: ["57E"],
		time_upper_limit: 60, time_lower_limit: 1,
	},
	{from: "HVT_B", to: "49E",
		rainfall: [{district: $WC, weight: 1}],
		dest: ["CBT","NPT","ED","SKT"],
		time_upper_limit: 60, time_lower_limit: 1,
	},
	{from: "49E", to: "57E",
		rainfall: [{district: $WC, weight: 1}],
		dest: ["NPT","ED","SKT"],
		notVia: ["HVT_B", "HVT_K"],
		time_upper_limit: 60, time_lower_limit: 1,
	},
	{from: "57E", to: "69E",
		rainfall: [{district: $EA, weight: 1}],
		dest: ["ED","SKT"],
		time_upper_limit: 60, time_lower_limit: 1,
	},
	{from: "69E", to: "81E",
		rainfall: [{district: $EA, weight: 1}],
		dest: ["ED","SKT"],
		time_upper_limit: 60, time_lower_limit: 1,
	},
	{from: "81E", to: "87E",
		rainfall: [{district: $EA, weight: 1}],
		dest: ["ED","SKT"],
		time_upper_limit: 60, time_lower_limit: 1,
	},
	{from: "87E", to: "93E",
		rainfall: [{district: $EA, weight: 1}],
		dest: ["ED","SKT"],
		time_upper_limit: 60, time_lower_limit: 1,
	},
	{from: "93E", to: "SKT",
		rainfall: [{district: $EA, weight: 1}],
		dest: ["SKT"],
		time_upper_limit: 60, time_lower_limit: 1,
	},
	//Special sections
	{from: "33E", to: "37E",
		rainfall: [{district: $CW, weight: 1}],
		dest: ["HVT_B","HVT_K","CBT","NPT","ED","SKT"],
		time_upper_limit: 60, time_lower_limit: 1,
	},
	//Full-length sections
	{from: "KTT", to: "HVT_B", to2: "HVT_K",
		rainfall: [{district: $CW, weight: 0.6},{district: $WC, weight: 0.4}],
		dest: ["HVT_B","HVT_K"],
		via: ["07E","19E","27E","33E","37E","49E"],
		notVia: ["57E"],
		time_upper_limit: 150, time_lower_limit: 10,
	},
	{from: "HVT_B", to: "SKT",
		rainfall: [{district: $WC, weight: 0.2},{district: $EA, weight: 0.8}],
		dest: ["SKT"],
		via: ["49E","57E","69E","81E","87E","93E"],
		notVia: ["37E"],
		time_upper_limit: 150, time_lower_limit: 10,
	},
	{from: "WMT", to: "SKT",
		rainfall: [{district: $CW, weight: 0.2},{district: $WC, weight: 0.3},{district: $EA, weight: 0.5}],
		dest: ["SKT"],
		via: ["27E","33E","37E","49E","57E","69E","81E","87E","93E"],
		notVia: ["HVT_B", "HVT_K"],
		time_upper_limit: 180, time_lower_limit: 10,
	},
];

/**
 * Tram Regressions
 */

exports.tram_regression_modes = {
	"default": {
		name: "Default",
		remarks: "Time of Day: Hourly Mean ; Day Classification: Weekday or Not ; Other Factors: Rainfall Only (Linear)",
		time_of_day_hourly_mean: true,
		day_classification_by_weekday: true,
		regression_variables_count: 1,
		regression_variables_label: ["R"],
		regression_variables_remarks: ["R: Rainfall (in mm)"],
		regression_variables: function(data){
			return [
				data.rainfall,
			];
		},
	},
	"rain_q": {
		name: "Other Factors: Rainfall: Quadratic",
		remarks: "",
		time_of_day_hourly_mean: true,
		day_classification_by_weekday: true,
		regression_variables_count: 2,
		regression_variables_label: ["R<sup>2</sup>","R"],
		regression_variables_remarks: ["R: Rainfall (in mm)"],
		regression_variables: function(data){
			return [
				data.rainfall*data.rainfall,
				data.rainfall,
			];
		},
	},
	"hko_l": {
		name: "Other Factors: Rainfall, HKO Temperature & Humidity (Linear)",
		remarks: "",
		time_of_day_hourly_mean: true,
		day_classification_by_weekday: true,
		regression_variables_count: 3,
		regression_variables_label: ["R", "T", "H"],
		regression_variables_remarks: ["R: Rainfall (in mm)","T: HKO Temperature (in ℃)","H: HKO Humidity (in %)"],
		regression_variables: function(data){
			if (data.HKO_temp != null && data.HKO_hum != null){
				return [
					data.rainfall,
					data.HKO_temp,
					data.HKO_hum,
				];
			}else{
				return null;
			}
		},
	},
	"hko_q": {
		name: "Other Factors: Rainfall, HKO Temperature & Humidity (Quadratic)",
		remarks: "",
		time_of_day_hourly_mean: true,
		day_classification_by_weekday: true,
		regression_variables_count: 9,
		regression_variables_label: ["R<sup>2</sup>", "T<sup>2</sup>", "H<sup>2</sup>", "R T", "R H", "T H", "R", "T", "H"],
		regression_variables_remarks: ["R: Rainfall (in mm)","T: HKO Temperature (in ℃)","H: HKO Humidity (in %)"],
		regression_variables: function(data){
			if (data.HKO_temp != null && data.HKO_hum != null){
				return [
					data.rainfall * data.rainfall,
					data.HKO_temp * data.HKO_temp,
					data.HKO_hum * data.HKO_hum,
					data.rainfall * data.HKO_temp,
					data.rainfall * data.HKO_hum,
					data.HKO_temp * data.HKO_hum,
					data.rainfall,
					data.HKO_temp,
					data.HKO_hum,
				];
			}else{
				return null;
			}
		},
	},
	"dow": {
		name: "Day Classification: Day of Week",
		remarks: "Public holidays are considered as Sundays.",
		time_of_day_hourly_mean: true,
		day_classification_by_weekday: false,
		regression_variables_count: 1,
		regression_variables_label: ["R"],
		regression_variables_remarks: ["R: Rainfall (in mm)"],
		regression_variables: function(data){
			return [
				data.rainfall,
			];
		},
	},
	"time_4": {
		name: "Time of Day: 4-Degree Polynomial Fitting",
		remarks: "Time of day is mapped to 0 ~ 1, than converted to variables from degree 1 to 4.",
		time_of_day_hourly_mean: false,
		day_classification_by_weekday: true,
		regression_variables_count: 5,
		regression_variables_label: ["t<sup>4</sup>","t<sup>3</sup>","t<sup>2</sup>","t","R"],
		regression_variables_remarks: ["t: Normalized time of day (0 ~ 1, i.e. hours / 24)","R: Rainfall (in mm)"],
		regression_variables: function(data){
			var tod = data.hours / 24;
			var m = 1;
			var arr = [];
			for (var i = 0; i < 4; i++){
				m *= tod;
				arr.unshift(m);
			}
			arr.push(data.rainfall);
			return arr;
		},
	},
	"time_6": {
		name: "Time of Day: 6-Degree Polynomial Fitting",
		remarks: "Time of day is mapped to 0 ~ 1, than converted to variables from degree 1 to 6.",
		time_of_day_hourly_mean: false,
		day_classification_by_weekday: true,
		regression_variables_count: 7,
		regression_variables_label: ["t<sup>6</sup>","t<sup>5</sup>","t<sup>4</sup>","t<sup>3</sup>","t<sup>2</sup>","t","R"],
		regression_variables_remarks: ["t: Normalized time of day (0 ~ 1, i.e. hours / 24)","R: Rainfall (in mm)"],
		regression_variables: function(data){
			var tod = data.hours / 24;
			var m = 1;
			var arr = [];
			for (var i = 0; i < 6; i++){
				m *= tod;
				arr.unshift(m);
			}
			arr.push(data.rainfall);
			return arr;
		},
	},
	"time_8": {
		name: "Time of Day: 8-Degree Polynomial Fitting",
		remarks: "Time of day is mapped to 0 ~ 1, than converted to variables from degree 1 to 8.",
		time_of_day_hourly_mean: false,
		day_classification_by_weekday: true,
		regression_variables_count: 9,
		regression_variables_label: ["t<sup>8</sup>","t<sup>7</sup>","t<sup>6</sup>","t<sup>5</sup>","t<sup>4</sup>","t<sup>3</sup>","t<sup>2</sup>","t","R"],
		regression_variables_remarks: ["t: Normalized time of day (0 ~ 1, i.e. hours / 24)","R: Rainfall (in mm)"],
		regression_variables: function(data){
			var tod = data.hours / 24;
			var m = 1;
			var arr = [];
			for (var i = 0; i < 8; i++){
				m *= tod;
				arr.unshift(m);
			}
			arr.push(data.rainfall);
			return arr;
		},
	},
};