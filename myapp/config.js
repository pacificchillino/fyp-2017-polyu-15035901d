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
	prediction: "violet",
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
const $SO = "Southern District";
const $KT = "Kwun Tong";
const $WT = "Wong Tai Sin";
const $KC = "Kowloon City";
const $YM = "Yau Tsim Mong";
const $SS = "Sham Shui Po";
const $SK = "Sai Kung";
const $ST = "Sha Tin";
const $TP = "Tai Po";
const $NO = "North District";
const $KW = "Kwai Tsing";
const $TW = "Tsuen Wan";
const $TM = "Tuen Mun";
const $YL = "Yuen Long";
const $IS = "Islands";
const $IS2 = "Islands District";
exports.rainfall_recorded = [$CW, $WC, $EA, $SO, $KT, $WT, $KC, $YM, $SS, $SK, $ST, $TP, $NO, $KW, $TW, $TM, $YL, $IS, $IS2];
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
exports.cron_time_tram_clean_data = "0 2 * * *";				//Clean tram data at 2:00am
exports.tram_eta_threshold = 60;//mins							//If the obtained ETA is over 60 mins (or under -60 mins), omit it
exports.tram_eta_nonarrived_limit = 120;//secs					//For determination of arrival time by non-arrived ETA, it must be less than 120 seconds
exports.cron_time_tram_get_eta = "0 * * * * *";					//Get ETA for all every minute
exports.cron_time_tram_get_eta2 = "10,20,30,40,50 * * * * *";	//Get ETA for isTerminus: true every 10 seconds (except @min)
exports.cron_time_tram_get_em = "5 */3 * * * *";				//Get emergency message every 3 minutes

//Stops that ETA data are required
const $E = "Eastbound";
const $W = "Westbound";

exports.tram_stops_for_eta = {
	"KTT": 		{direction: $E, isTerminus: true, name: "Kennedy Town", district: $CW},
	"07E": 		{direction: $E, isTerminus: false, name: "Hill Road, Shek Tong Tsui", district: $CW},
	"WMT": 		{direction: $E, isTerminus: true, name: "Western Market, Sheung Wan", district: $CW},
	"19E": 		{direction: $E, isTerminus: false, name: "Macau Ferry, Sheung Wan", district: $CW},
	"27E": 		{direction: $E, isTerminus: false, name: "Pedder Street, Central", district: $CW},
	"33E": 		{direction: $E, isTerminus: false, name: "Murray Street, Central", district: $CW},
	"35E": 		{direction: $E, isTerminus: false, name: "Admiralty Station", district: $CW},
	"37E": 		{direction: $E, isTerminus: false, name: "Arsenal Street, Wan Chai", district: $WC},
	"49E": 		{direction: $E, isTerminus: false, name: "Canal Road, Causeway Bay", district: $WC},
	"HVT":		{direction: "", name: "Happy Valley", isDummy: true},
	"HVT_B": 	{direction: $E, isTerminus: true, name: "Happy Valley", district: $WC}, //To Shau Kei Wan
	"HVT_K": 	{direction: $W, isTerminus: false, name: "Happy Valley", district: $WC}, //To Kennedy Town
	"57E": 		{direction: $E, isTerminus: false, name: "Victoria Park", district: $WC},
	"69E": 		{direction: $E, isTerminus: false, name: "North Point Road", district: $EA},
	"81E": 		{direction: $E, isTerminus: false, name: "Finnie Street, Quarry Bay", district: $EA},
	"87E": 		{direction: $E, isTerminus: false, name: "Kornhill, Tai Koo", district: $EA},
	"93E": 		{direction: $E, isTerminus: false, name: "Tai On Street, Sai Wan Ho", district: $EA},
	"SKT": 		{direction: $W, isTerminus: false, name: "Shau Kei Wan", district: $EA},
};

//Combined from/to available for prediction service
exports.tram_prediction_from_to = [
	{between: ["KTT","07E","19E","27E","35E","49E","57E","69E","81E","87E","93E","SKT"]}, //Between Kennedy Town and Shaukeiwan
	{from: ["KTT","07E","19E","27E","35E","49E"], to: ["HVT"]}, //Between Kennedy Town and Happy Valley
	{from: ["HVT"], to: ["49E","57E","69E","81E","87E","93E","SKT"]}, //Between Hapy Valley and Shaukeiwan
	{from: ["WMT"], to: ["SKT"]}, //Full-trip Section: Western Market to Shaukeiwan
	{from: ["KTT"], to: ["HVT"]}, //Full-trip Section: Kennedy Town to Happy Valley
	{from: ["HVT"], to: ["SKT"]}, //Full-trip Section: Happy Valley to Shau Kei Wan
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
	{from: "49E", to: "HVT_B", to2: "HVT_K", to_alt: "HVT",
		rainfall: [{district: $WC, weight: 1}],
		dest: ["HVT_B","HVT_K"],
		notVia: ["57E"],
		time_upper_limit: 60, time_lower_limit: 1,
	},
	{from: "HVT_B", to: "49E", from_alt: "HVT",
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
	{from: "33E", to: "37E", isSpecialSection: true,
		rainfall: [{district: $CW, weight: 1}],
		dest: ["HVT_B","HVT_K","CBT","NPT","ED","SKT"],
		time_upper_limit: 60, time_lower_limit: 1,
	},
	//Full-length sections
	{from: "KTT", to: "HVT_B", to2: "HVT_K", to_alt: "HVT", isSpecialSection: true,
		rainfall: [{district: $CW, weight: 0.6},{district: $WC, weight: 0.4}],
		dest: ["HVT_B","HVT_K"],
		via: ["07E","19E","27E","33E","37E","49E"],
		notVia: ["57E"],
		time_upper_limit: 150, time_lower_limit: 10,
	},
	{from: "HVT_B", to: "SKT", from_alt: "HVT", isSpecialSection: true,
		rainfall: [{district: $WC, weight: 0.2},{district: $EA, weight: 0.8}],
		dest: ["SKT"],
		via: ["49E","57E","69E","81E","87E","93E"],
		notVia: ["37E"],
		time_upper_limit: 150, time_lower_limit: 10,
	},
	{from: "WMT", to: "SKT", isSpecialSection: true,
		rainfall: [{district: $CW, weight: 0.2},{district: $WC, weight: 0.3},{district: $EA, weight: 0.5}],
		dest: ["SKT"],
		via: ["27E","33E","37E","49E","57E","69E","81E","87E","93E"],
		notVia: ["HVT_B", "HVT_K"],
		time_upper_limit: 180, time_lower_limit: 10,
	},
];