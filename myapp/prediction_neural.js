var config = require("./config.js");
var func = require("./func.js");

exports.name = "Neural Network Model";
exports.description = "Using neural networks for learning and predicting travelling time with mulitple input parameters.";
exports.modes = {
	//...
};

/**
 * Variables:
 * - lastUpdate
 * - average_tt["sectCollection"]
 */

var lastUpdate;

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
};

/**
 * Method for Making a Prediction for a Section
 */
exports.predict = function(sectCollection, mode, inputData){

};