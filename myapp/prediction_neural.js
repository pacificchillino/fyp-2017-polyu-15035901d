var config = require("./config.js");
var func = require("./func.js");

var brain = require('brain.js');

exports.name = "Artificial Neural Network Model";
exports.description = "Using Artificial Neural Network for travelling time prediction.";

var maxTravellingTime = 200;
var maxRainfall = 300;
var minTemperature = -10;
var maxTemperature = 50;

/**
 * There is only one mode due to resource limitations
 */

exports.modes = {
	"default": {
		name: "Default",
		description: "Inputs: Public Holiday?, Day of Week, Time of Day, Rainfall or Not, Rainfall, HKO Temperature, HKO Humidity; Output: Travelling time in mins",
		inputArrayFunction: function(data){
			if (data.HKO_temp != null){
				return [
					(data.PH ? 1 : 0),
					(data.dayOfWk / 6),
					(rotateHours(data.hours) / 24),
					(data.rainfall ? 1 : 0),
					cap01(data.rainfall / maxRainfall),
					cap01((data.HKO_temp - minTemperature) / (maxTemperature - minTemperature)),
					(data.HKO_hum / 100),
				];
			}else{
				return null;
			}
		},
	},
};

//Training Options
var options = {
	/*iterations: 10000,
	errorThresh: 0.5 / maxTravellingTime,
	log: true,
	logPeriod: 100,
	learningRate: 0.01,
	timeout: 300000, //5 minutes*/
};

//Rotate hours to fit date changing time
function rotateHours(hours){
	hours -= config.hour_date_turnover;
	if (hours < 0) hours += 24;
	return hours;
}

//Normalize
function cap01(value){
	if (value < 0) return 0;
	else if (value > 1) return 1;
	else return value;
}

/**
 * Variables:
 * - lastUpdate
 * - ann["sectCollection"]
 */

var lastUpdate;
var ann = new Object();

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
	//Define Neural Networks
	ann[sectCollection] = new brain.NeuralNetwork();
	//Training
	var trainingSet = new Array();
	for (var i in data){
		var input = exports.modes.default.inputArrayFunction(data[i]);
		var output = [data[i].tt_mins / maxTravellingTime];
		if (input != null){
			trainingSet.push({
				input: input,
				output: output,
			});
		}
	}
	ann[sectCollection].train(trainingSet, options);
};

/**
 * Method for Making a Prediction for a Section
 */
exports.predict = function(sectCollection, mode, inputData){
	var input = exports.modes.default.inputArrayFunction(inputData);
	if (input != null){
		var output = ann[sectCollection].run(input)[0] * maxTravellingTime;
		return output;
	}
	return null;
};

/**
 * Method for Showing Details Information for this Predictor, with a Section
 */
exports.getPredictorDetails = function(sectCollection){

};