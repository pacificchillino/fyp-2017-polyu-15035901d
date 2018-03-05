var config = require("./config.js");
var func = require("./func.js");

var synaptic = require('synaptic');
var Neuron = synaptic.Neuron;
var Layer = synaptic.Layer;
var Network = synaptic.Network;
var Trainer = synaptic.Trainer;
var Architect = synaptic.Architect;

exports.name = "Artificial Neural Network Model";
exports.description = "Using Artificial Neural Network for travelling time prediction.";

var maxTravellingTime = 200;
var maxRainfall = 300;
var minTemperature = -10;
var maxTemperature = 50;

var learningRate = 0.1;
var initialIterations = (process.platform == "win32") ? 1000 : 10000;

var disabled = false; //disabled = (process.platform == "win32") ? false : true;

/*var trainingOptions = {
	rate: 0.1,
	iterations: 10000,
	error: 0.001,
}*/

/**
 * There is only one mode due to resource limitations
 */

exports.modes = {
	"default": {
		name: "Default",
		description: "Inputs: Public Holiday?, Day of Week, Time of Day, Rainfall or Not, Rainfall, HKO Temperature, HKO Humidity; Hidden layers: [50, 5]; Output: Travelling time in mins",
		inputLayerSize: 7,
		hiddenLayerSize: [50, 5],
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
 * - ann["sectCollection"].network
 * - ann["sectCollection"].inputLayer
 * - ann["sectCollection"].hiddenLayer[i]
 * - ann["sectCollection"].outputLayer
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
	if (!disabled){
		var hiddenLayerSize = exports.modes.default.hiddenLayerSize.length;
		//Define Main Object
		ann[sectCollection] = new Object();
		//Define Layers
		ann[sectCollection].inputLayer = new Layer(exports.modes.default.inputLayerSize);
		ann[sectCollection].hiddenLayer = new Array();
		for (var i = 0; i < hiddenLayerSize; i++){
			ann[sectCollection].hiddenLayer[i] = new Layer(exports.modes.default.hiddenLayerSize[i]);
		}
		ann[sectCollection].outputLayer = new Layer(1);
		//Define Projections
		ann[sectCollection].inputLayer.project(ann[sectCollection].hiddenLayer[0]);
		for (var i = 1; i < hiddenLayerSize; i++){
			ann[sectCollection].hiddenLayer[i-1].project(ann[sectCollection].hiddenLayer[i]);
		}
		ann[sectCollection].hiddenLayer[hiddenLayerSize-1].project(ann[sectCollection].outputLayer);
		//Define Network
		ann[sectCollection].network = new Network({
			input: ann[sectCollection].inputLayer,
			hidden: ann[sectCollection].hiddenLayer,
			output: ann[sectCollection].outputLayer,
		});
		//Training
		/*ann[sectCollection].trainer = new Trainer(ann[sectCollection].network);
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
		ann[sectCollection].trainer.train(trainingSet, trainingOptions);*/
		for (var j = 1; j <= initialIterations; j++){
			if (j % 100 == 0) func.msg2("--> --> ANN: Iteration #" + j, config.debug_color.prediction);
			for (var i in data){
				var input = exports.modes.default.inputArrayFunction(data[i]);
				var output = [data[i].tt_mins / maxTravellingTime];
				if (input != null){
					ann[sectCollection].network.activate(input);
					ann[sectCollection].network.propagate(learningRate, output);
				}
			}
		}
	}
};

/**
 * Method for Making a Prediction for a Section
 */
exports.predict = function(sectCollection, mode, inputData){
	if (!disabled){
		var input = exports.modes.default.inputArrayFunction(inputData);
		if (input != null){
			return ann[sectCollection].network.activate(input)[0] * maxTravellingTime;
		}
	}
	return null;

};

/**
 * Method for Showing Details Information for this Predictor, with a Section
 */
exports.getPredictorDetails = function(sectCollection){
	if (!disabled){

	}
};