var config = require("./config.js");
var func = require("./func.js");

exports.name = "K-Nearest-Neighbours Model";
exports.description = "Using K-Nearest-Neighbours (KNN) for predicting travelling time with mulitple input parameters.";
exports.modes = {
	"default": {
		name: "Default",
		description: "No of neighbours: 5; Vector: Normalized time of day, Sigmoid-normalized rainfall, binarized 'weekday or not'",
		vector: function($){
			return [$.t, $.s_R, $.wkday];
		},
		noOfNeighbours: 5,
	},
	"less_n": {
		name: "Less neighbours",
		description: "No of neighbours: 2; Vector: Normalized time of day, Sigmoid-normalized rainfall, binarized 'weekday or not'",
		vector: function($){
			return [$.t, $.s_R, $.wkday];
		},
		noOfNeighbours: 2,
	},
	"more_n": {
		name: "More neighbours",
		description: "No of neighbours: 10; Vector: Normalized time of day, Sigmoid-normalized rainfall, binarized 'weekday or not'",
		vector: function($){
			return [$.t, $.s_R, $.wkday];
		},
		noOfNeighbours: 10,
	},
	"rain_b": {
		name: "Binarized Rainfall",
		description: "No of neighbours: 5; Vector: Normalized time of day, Binarized rainfall, binarized 'weekday or not'",
		vector: function($){
			return [$.t, $.b_R, $.wkday];
		},
		noOfNeighbours: 5,
	},
	"hko": {
		name: "HKO Temperature & Humidity",
		description: "No of neighbours: 5; Vector: Normalized time of day, Binarized rainfall, HKO Temperature, HKO Humidity, binarized 'weekday or not'",
		vector: function($){
			return [$.t, $.b_R, $.T_n, $.H_n, $.wkday];
		},
		noOfNeighbours: 5,
	},
	"dow": {
		name: "Day of Week",
		description: "No of neighbours: 5; Vector: Normalized time of day, Sigmoid-normalized rainfall, normalized day of week",
		vector: function($){
			return [$.t, $.s_R, $.dayOfWk];
		},
		noOfNeighbours: 5,
	},
};

/**
 * Function to map data into variable lists
 */

function mapDataToVarList(data){
	return {
		output: data.tt_mins, //Actual output value
		//
		t: (rotateHours(data.hours) / 24), //Normalized time of day
		s_R: (sigmoid(data.rainfall) * 2 - 1), //Such that value is 0 for rainfall = 0, and tends to 1
		b_R: (binarize(data.rainfall)), //1 for having rain, 0 for no
		T_n: (data.HKO_temp == null) ? null : ((data.HKO_temp - 20) / 100 + 0.5), // Small impact on temperature
		H_n: (data.HKO_hum == null) ? null : ((data.HKO_hum - 50) / 200 + 0.5), // Small impact on humidity
		wkday: (data.wkday ? 1 : 0), //1 for weekday, 0 for non-weekday
		dayOfWk: (data.dayOfWk / 7), //Day of week (normalized to 0 ~ 1)
	};
}

/**
 * Other Functions
 */

//Sigmoid Function
function sigmoid(t) {
    return 1 / (1 + Math.pow(Math.E, -t));
}

//Binarize Function --> to 1 or 0
function binarize(t){
	return (t > 0) ? 1 : 0;
}

//Calculate Euclidean Distance between two vectors
function distance(v2,v1){
	var sum = 0;
	for (var i in v2){
		if (v2[i] == null || v1[i] == null){
			return null;
		}
		sum += (v2[i] - v1[i]) * (v2[i] - v1[i]);
	}
	return sum;
}

//Rotate hours to fit date changing time
function rotateHours(hours){
	hours -= config.hour_date_turnover;
	if (hours < 0) hours += 24;
	return hours;
}

/**
 * Variables:
 * - lastUpdate
 * - varLists["sectCollection"][i]
 */

var lastUpdate;
var varLists = new Object();

/**
 * Method for Obtaining Last Update Time
 */

exports.getLastUpdate = function(){
	return lastUpdate;
}

/**
 * Method for Initialization of a Section of Prediction (when server starts or at midnight)
 */

exports.init = function(sectCollection, data){
	lastUpdate = new Date();
	//Define new array
	varLists[sectCollection] = new Array();
	for (var i in data){
		varLists[sectCollection].push(mapDataToVarList(data[i]));
	}
};

/**
 * Method for Making a Prediction for a Section
 */
exports.predict = function(sectCollection, mode, inputData){
	//Validate first
	if (varLists[sectCollection] == null){
		return null;
	}
	if (exports.modes[mode] == null){
		return null;
	}
	//Set up my vector
	var myVarList = mapDataToVarList(inputData);
	//Obtain my mode info
	var noOfNeighbours = exports.modes[mode].noOfNeighbours;
	var vectorFunction = exports.modes[mode].vector;
	var myVector = vectorFunction(myVarList);
	//Set up array of nearest neighbours: {dist, output}
	var recentNearestNeighbours = new Array();
	//For each data compared
	for (var i in varLists[sectCollection]){
		var theVector = vectorFunction(varLists[sectCollection][i]);
		var theDistance = distance(theVector, myVector);
		var theOutput = varLists[sectCollection][i].output;
		if (theDistance != null){//In the array
			var indexToSplice = -1;
			for (var j = 0; j < recentNearestNeighbours.length; j++){
				//Compare with the existing items, if smaller, than push before
				if (theDistance < recentNearestNeighbours[j].dist){
					indexToSplice = j;
					j = recentNearestNeighbours.length; //End loop
				}
			}
			//Add in the front
			if (j > -1){
				recentNearestNeighbours.splice(indexToSplice, 0, {dist: theDistance, output: theOutput});
				if (recentNearestNeighbours.length > noOfNeighbours){
					recentNearestNeighbours.pop();
				}
			}
			//Add at the back
			else{
				if (recentNearestNeighbours.length < noOfNeighbours){
					recentNearestNeighbours.push({dist: theDistance, output: theOutput});
				}
			}
		}
	}
	//Calculate mean value of the nearest neighbours
	var sum = 0;
	var count = 0;
	for (var i in recentNearestNeighbours){
		count++;
		sum += recentNearestNeighbours[i].output;
	}
	if (count == 0){
		return null;
	}else{
		return sum / count;
	}
};