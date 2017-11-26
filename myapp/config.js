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
 * Debug color settings
 */

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
exports.weather_time_start = 5;//hours							//Omit weather recordings beginning before 5am
exports.cron_time_weather_start = "0 5 * * *";
exports.weather_time_end = 0;//hours							//Omit weather recordings beginning after 12am
exports.cron_time_weather_end = "0 0 * * *";

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
exports.cron_time_tram_update_regression = "30 3 * * *";		//Update regression variables at 3:30am

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

//Sections to be recorded
exports.tram_est_sections = [
	//Main Sections
	{from: "KTT", to: "07E",
		rainfall: [{district: $CW, weight: 1}],
		dest: ["WM","HVT_B","HVT_K","CBT","NPT","ED","SKT"],
		time_upper_limit: 90,
	},
	{from: "07E", to: "19E",
		rainfall: [{district: $CW, weight: 1}],
		dest: ["WM","HVT_B","HVT_K","CBT","NPT","ED","SKT"],
		time_upper_limit: 90,
	},
	{from: "19E", to: "27E",
		rainfall: [{district: $CW, weight: 1}],
		dest: ["HVT_B","HVT_K","CBT","NPT","ED","SKT"],
		time_upper_limit: 90,
	},
	{from: "27E", to: "35E",
		rainfall: [{district: $CW, weight: 1}],
		dest: ["HVT_B","HVT_K","CBT","NPT","ED","SKT"],
		time_upper_limit: 90,
	},
	{from: "35E", to: "49E",
		rainfall: [{district: $CW, weight: 0.2},{district: $WC, weight: 0.8}],
		dest: ["HVT_B","HVT_K","CBT","NPT","ED","SKT"],
		time_upper_limit: 90,
	},
	{from: "49E", to: "HVT_B", to2: "HVT_K",
		rainfall: [{district: $WC, weight: 1}],
		dest: ["HVT_B","HVT_K"],
		time_upper_limit: 90,
	},
	{from: "HVT_B", to: "49E",
		rainfall: [{district: $WC, weight: 1}],
		dest: ["CBT","NPT","ED","SKT"],
		time_upper_limit: 90,
	},
	{from: "49E", to: "57E",
		rainfall: [{district: $WC, weight: 1}],
		dest: ["NPT","ED","SKT"],
		time_upper_limit: 90,
	},
	{from: "57E", to: "69E",
		rainfall: [{district: $EA, weight: 1}],
		dest: ["ED","SKT"],
		time_upper_limit: 90,
	},
	{from: "69E", to: "81E",
		rainfall: [{district: $EA, weight: 1}],
		dest: ["ED","SKT"],
		time_upper_limit: 90,
	},
	{from: "81E", to: "87E",
		rainfall: [{district: $EA, weight: 1}],
		dest: ["ED","SKT"],
		time_upper_limit: 90,
	},
	{from: "87E", to: "93E",
		rainfall: [{district: $EA, weight: 1}],
		dest: ["ED","SKT"],
		time_upper_limit: 90,
	},
	{from: "93E", to: "SKT",
		rainfall: [{district: $EA, weight: 1}],
		dest: ["SKT"],
		time_upper_limit: 90,
	},
	//Special sections
	{from: "33E", to: "37E",
		rainfall: [{district: $CW, weight: 1}],
		dest: ["HVT_B","HVT_K","CBT","NPT","ED","SKT"],
		time_upper_limit: 90,
	},
	//Full-length sections
	{from: "KTT", to: "HVT_B", to2: "HVT_K",
		rainfall: [{district: $CW, weight: 0.6},{district: $WC, weight: 0.4}],
		dest: ["HVT_B","HVT_K"],
		time_upper_limit: 150,
	},
	{from: "HVT_B", to: "SKT",
		rainfall: [{district: $WC, weight: 0.2},{district: $EA, weight: 0.8}],
		dest: ["SKT"],
		time_upper_limit: 150,
	},
	{from: "WMT", to: "SKT",
		rainfall: [{district: $WC, weight: 0.2},{district: $EA, weight: 0.8}],
		dest: ["SKT"],
		time_upper_limit: 150,
	},
];