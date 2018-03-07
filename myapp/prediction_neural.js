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
		description: "",
		inputArrayFunction: function(data){
			if (data.HKO_temp != null){
				return [
					(data.PH) ? 1 : 0,
					(data.dayOfWk / 6),
					logit(rotateHours(data.hours) / 24),
					cap01(data.rainfall / maxRainfall) / 2 + 0.5,
					cap01((data.HKO_temp - minTemperature) / (maxTemperature - minTemperature)) / 2 + 0.5,
					(data.HKO_hum / 100) / 2 + 0.5,
				];
			}else{
				return null;
			}
		},
		inputs_description: [
			"Sunday or Public Holiday: 1; else: 0",
			"(Day of Week / 6) --> Sunday: 0, ... , Saturday: 1",
			"logit[(Hours - 3) / 24], where logit is reverse sigmoid function",
			"Rainfall (0 ~ 200mm) normalized to (0.5 ~ 1)",
			"Temperature (-10 ~ 50°C) normalized to (0.5 ~ 1)",
			"Humidity (0 ~ 100%) normalized to (0.5 ~ 1)",
		],
		output_description: "Predicted travelling time (0 ~ 300 mins) normalized to (0 ~ 1)",
		remarks: [
			"Sigmoid function is used for activation of neurons",
		]
	},
};

//Training Options
var training_options = function(){
	return{
		iterations: func.isDuringTramRecordingTimeB() ? 1000 : 10000,
		errorThresh: 1e-9,
		log: true,
		logPeriod: 100,
		learningRate: 0.1,
		timeout: 300000, //5 minutes
	};
};

//ANN options
var ann_options = function(){
	return {
		hiddenLayers: [12, 6, 3],
	};
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

//Reverse-sigmoid function
function logit (value){
	if (value <= 0) return -Infinity;
	else if (value >= 1) return Infinity;
	else return Math.log(value / (1 - value));
}

/**
 * Variables:
 * - ann["sectCollection"]
 */

var ann = new Object();

/**
 * Method for Initialization of a Section of Prediction (when server starts or at midnight)
 */

exports.init = function(sectCollection, data){
	//Define Neural Networks
	ann[sectCollection] = new brain.NeuralNetwork(ann_options());
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
	ann[sectCollection].train(trainingSet, training_options());
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
	return {
		mode: exports.modes,
		json: ann[sectCollection].toJSON(),
		updates_info: global.prediction.getUpdatesInfo(sectCollection, "neural"),
	};
};