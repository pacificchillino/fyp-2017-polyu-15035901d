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
	tram: "#060",
	error: "red",
};

/**
 * Tram settings
 */
exports.tram_time_start = 6;//hours						//Omit time recordings beginning before 6am
exports.tram_time_end = 24;//hours						//Omit time recordings beginning after 12am
exports.tram_time_cutoff = 25.5;//hours					//Discard recordings which are unable to end before 1:30am
exports.tram_date_turnover = 3;//hours					//Before 3am, it is considered as the previous day
exports.tram_eta_threshold = 60;//mins					//If the obtained ETA is over 60 mins (or under -60 mins), omit it

//Stops that ETA data are required, obtained every 60 seconds if isBegin = true, 20 seconds if isBegin = false
exports.tram_stops_for_eta = [
	{stop: "KTT", isBegin: true, name: "Kennedy Town"},
	{stop: "07E", isBegin: false, name: "Hill Road, Shek Tong Tsui"},
	{stop: "19E", isBegin: false, name: "Macau Ferry, Sheung Wan"},
	{stop: "27E", isBegin: false, name: "Pedder Street, Central"},
	{stop: "33E", isBegin: false, name: "Murray Street, Central"},
	{stop: "35E", isBegin: false, name: "Admiralty Station"},
	{stop: "37E", isBegin: false, name: "Arsenal Street, Wan Chai"},
	{stop: "49E", isBegin: false, name: "Canal Road, Causeway Bay"},
	{stop: "HVT_B", isBegin: true, name: "Happy Valley"}, //To Shau Kei Wan
	{stop: "HVT_K", isBegin: false, name: "Happy Valley"}, //To Kennedy Town
	{stop: "57E", isBegin: false, name: "Victoria Park"},
	{stop: "69E", isBegin: false, name: "North Point Road"},
	{stop: "81E", isBegin: false, name: "Finnie Street, Quarry Bay"},
	{stop: "87E", isBegin: false, name: "Kornhill, Tai Koo"},
	{stop: "93E", isBegin: false, name: "Tai On Street, Sai Wan Ho"},
	{stop: "SKT", isBegin: false, name: "Shau Kei Wan"},
];

//Sections to be recorded
const $CW = "Central & Western District";
const $WC = "Wan Chai";
const $EA = "Eastern District";
exports.tram_est_sections = [
	//Main Sections
	{from: ["KTT"], to: ["07E"],
		rainfall: [{district: $CW, weight: 1}],
		dest: ["WM","HVT_B","HVT_K","CBT","NPT","ED","SKT"],
	},
	{from: ["07E"], to: ["19E"],
		rainfall: [{district: $CW, weight: 1}],
		dest: ["WM","HVT_B","HVT_K","CBT","NPT","ED","SKT"],
	},
	{from: ["19E"], to: ["27E"],
		rainfall: [{district: $CW, weight: 1}],
		dest: ["HVT_B","HVT_K","CBT","NPT","ED","SKT"],
	},
	{from: ["27E"], to: ["35E"],
		rainfall: [{district: $CW, weight: 1}],
		dest: ["HVT_B","HVT_K","CBT","NPT","ED","SKT"],
	},
	{from: ["35E"], to: ["49E"],
		rainfall: [{district: $CW, weight: 0.2},{district: $WC, weight: 0.8}],
		dest: ["HVT_B","HVT_K","CBT","NPT","ED","SKT"],
	},
	{from: ["49E"], to: ["HVT_B","HVT_K"],
		rainfall: [{district: $WC, weight: 1}],
		dest: ["HVT_B","HVT_K"],
	},
	{from: ["HVT_B","HVT_K"], to: ["49E"],
		rainfall: [{district: $WC, weight: 1}],
		dest: ["CBT","NPT","ED","SKT"],
	},
	{from: ["49E"], to: ["57E"],
		rainfall: [{district: $WC, weight: 1}],
		dest: ["NPT","ED","SKT"],
	},
	{from: ["57E"], to: ["69E"],
		rainfall: [{district: $EA, weight: 1}],
		dest: ["ED","SKT"],
	},
	{from: ["69E"], to: ["81E"],
		rainfall: [{district: $EA, weight: 1}],
		dest: ["ED","SKT"],
	},
	{from: ["81E"], to: ["87E"],
		rainfall: [{district: $EA, weight: 1}],
		dest: ["ED","SKT"],
	},
	{from: ["87E"], to: ["93E"],
		rainfall: [{district: $EA, weight: 1}],
		dest: ["ED","SKT"],
	},
	{from: ["93E"], to: ["SKT"],
		rainfall: [{district: $EA, weight: 1}],
		dest: ["SKT"],
	},
];

/**
 * Weather settings
 */
exports.rainfall_interpretation = function(str){		//For "x to y", consider as (x+y)/2
	var rainfall = str.split(" to ");
	if (rainfall.length == 1){
		return parseInt(rainfall[0]);
	}else{
		return (parseInt(rainfall[0]) + parseInt(rainfall[1])) / 2;
	}
};