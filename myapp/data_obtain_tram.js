var config = require("./config.js");
var func = require("./func.js");
var _ = require('underscore');

var HongKongTrams = require("./include/hongkong-trams.js");
var trams = new HongKongTrams();

var TramRecorder = require("./TramRecorder.js");

//Variables
var tramStops = [];				//Array of all tram stops
var tramStops2 = [];			//Array of tram stops for isTerminus : true
var tramsETA = {};				//ETA data, e.g. tramsETA["50W"].now, tramsETA["50W"].prev
var tramRecorders = [];			//Object to host TramRecorder instances
var tramEM = {};				//Emergency message data

exports.init = function(isDateTurnover){
	//Socket Message
	func.msg(isDateTurnover ? "Data Obtain : Day changed. Re-initialized." : "Data Obtain : Initialized.", config.debug_color.hour);

	//Reset variables
	tramStops = [];
	tramStops2 = [];
	tramEM = {};
	
	//Trams: initialize variables
	for (var stop in config.tram_stops_for_eta){
		//Update tramStops, tramStops2
		if (config.tram_stops_for_eta[stop].isTerminus){
			tramStops2.push(stop);
		}
		tramStops.push(stop);
		//Update tramsETA
		tramsETA[stop] = {};
		tramsETA[stop].hasError = false;
	}

	//Trams: setup TramRecorder instances
	if (!isDateTurnover){
		//Fresh Start
		for (var i = 0; i < config.tram_est_sections.length; i++){
			var obj = config.tram_est_sections[i];
			if (obj.to2 == null){
				tramRecorders.push(new TramRecorder(i, obj.from, obj.to));
			}else{
				tramRecorders.push(new TramRecorder(i, obj.from, obj.to, obj.to2));
			}
		}
	}else{
		//Date turnover
		for (var i in tramRecorders){
			tramRecorders[i].restart();
		}
	}

	//Emergency Message
	obtainTramEM_2();
}

/**
 * Obtain tram ETA
 */

function etaObtainedFunction(eta){
	//Prevent from errorenous ETAs
	var error = false;
	//If incoming ETA is empty and there are more than 1 element in the recent ETA, consider as error
	if (eta.length == 0){
		if (tramsETA[this.stop].now != null){
			if (tramsETA[this.stop].now.length > 1){
				error = true;
			}
		}
	}
	//No error
	if (!error){
		//Filter etas that are too extreme
		for (var i = eta.length - 1; i >= 0; i--){
			var absMin = Math.abs(eta[i].arrive_in_second / 60);
			if (absMin > config.tram_eta_threshold){
				eta.splice(i,1);
			}
		}
		//Shift now to prev
		if (tramsETA[this.stop].nowTime != null){
			tramsETA[this.stop].prev = new Array().concat(tramsETA[this.stop].now);
			tramsETA[this.stop].prevTime = tramsETA[this.stop].nowTime;
		}
		//Add new data
		tramsETA[this.stop].now = eta;
		tramsETA[this.stop].nowTime = new Date();
		tramsETA[this.stop].hasError = false;
	}
	//Has error
	else{
		etaObtainFailedFunction(null).bind({stop: this.stop});
	}
}

function etaObtainFailedFunction(err){
	//Set error flag
	tramsETA[this.stop].hasError = true;
	//Socket Message
	func.msg("Tram : Error obtaining data for stop " + this.stop, config.debug_color.error);
}

exports.obtainTramETA = function(isTerminus){
	//Check if within time range
	if (func.isDuringTramRecordingTimeB()){
		obtainTramETA_2(isTerminus);
	}
};

function obtainTramETA_2(isTerminus){
	//tramStops2: only stops with isTerminus = true ; tramStops: all stops
	var myList = isTerminus ? tramStops2 : tramStops;
	//Socket Message
	func.msg("Tram : Obtaining ETA data for " + myList.join(", "),config.debug_color.tram);
	//Obtain Data
	var promises = new Array();
	_.each(myList, function(stop) {
		promises.push(
			trams.getNextTramETA(stop).then(
				etaObtainedFunction.bind({stop: stop})
			).catch(
				etaObtainFailedFunction.bind({stop: stop})
			)
		);
	});
	//When all data obtained: Update TramRecorder instances
	if (isTerminus){
		//For isTerminus = true
		Promise.all(promises).then(function(){
			//Socket Message
			func.msg("Tram : ETA data obtained",config.debug_color.tram);
			//Do only when having rainfall data
			if (otherDataOkay()){
				for (var i in tramRecorders){
					//Filter out TramRecorders which "from" isTerminus
					if (tramRecorders[i].stopA_isTerminus){
						//Ensure having no data errors
						if (!tramsETA[tramRecorders[i].stopA].hasError){
							tramRecorders[i].feedData({
								type: "A",
								tramData: tramsETA[tramRecorders[i].stopA],
								otherData: getOtherData(),
							});
						}
					}
				}
			}
		});
	}else{
		//For isTerminus = false
		Promise.all(promises).then(function(){
			//Socket Message
			func.msg("Tram : ETA data obtained",config.debug_color.tram);
			//Do only when having rainfall data
			if (otherDataOkay()){
				for (var i in tramRecorders){
					var flushable = false;
					//StopA: Ensure having no data errors --> feed data to TramRecorder instance
					if (!tramsETA[tramRecorders[i].stopA].hasError){
						//No E.M.
						if (tramEM[tramRecorders[i].stopA] == false){
							tramRecorders[i].feedData({
								type: "A",
								tramData: tramsETA[tramRecorders[i].stopA],
								otherData: getOtherData(),
							});
						}
						//Has E.M.
						else{
							flushable = true;
						};
					}
					//StopB: Ensure having no data errors --> feed data to TramRecorder instance
					if (tramRecorders[i].stopB2 == null){
						//Without B2
						if (!tramsETA[tramRecorders[i].stopB].hasError){
							//No E.M.
							if (tramEM[tramRecorders[i].stopB] == false){
								tramRecorders[i].feedData({
									type: "B",
									tramData: tramsETA[tramRecorders[i].stopB],
									otherData: getOtherData(),
								});
							}
							//Has E.M.
							else{
								flushable = true;
							};
						}
					}else{
						//With B2
						if ((!tramsETA[tramRecorders[i].stopB].hasError) && (!tramsETA[tramRecorders[i].stopB2].hasError)){
							//No E.M.
							if (tramEM[tramRecorders[i].stopB] == false && tramEM[tramRecorders[i].stopB2] == false){
								tramRecorders[i].feedData({
									type: "B",
									tramData: tramsETA[tramRecorders[i].stopB],
									tramData2: tramsETA[tramRecorders[i].stopB2],
									otherData: getOtherData(),
								});
							}
							//Has E.M.
							else{
								flushable = true;
							};
						}
					}
					//via - if E.M. happens in such stops, flush the recorder
					for (var j in tramRecorders[i].via){
						if (tramEM[tramRecorders[i].via[j]] != false){
							flushable = true;
						}
					}
					if (flushable){ //Flush (clear all running data) in the recorder
						tramRecorders[i].flush();
					}
					//notVia - trams should not pass thru such stops
					for (var j in tramRecorders[i].notVia){
						var nvStop = tramRecorders[i].notVia[j];
						if (!tramsETA[nvStop].hasError){
							tramRecorders[i].feedData({
								type: "V",
								tramData: tramsETA[nvStop],
							});
						};
					};
					//Clear expired data
					tramRecorders[i].clearExpired();
				}
			}
		});
	}
}

/**
 * Obtain tram emergency message --> if there is E.M., stop recording for that stop
 */
exports.obtainTramEM = function(){
	//Check if within time range
	if (func.isDuringTramRecordingTimeB()){
		obtainTramEM_2();
	}
};

function obtainTramEM_2(){
	//Socket Message
	func.msg("Tram : Obtaining emergency message for " + tramStops.join(", "),config.debug_color.tram);
	//Obtain Data
	_.each(tramStops, function(stop) {
		trams.getEmergencyMessageForTramStop(stop).then(
			emObtainedFunction.bind({stop: stop})
		).catch(
			emObtainFailedFunction.bind({stop: stop})
		);
	});
}

function emObtainedFunction(emsg){
	tramEM[this.stop] = (emsg.length > 0);
	if (emsg.length > 0){
		//Socket Message
		func.msg2("Tram : There is emergency message for stop " + this.stop, JSON.stringify(emsg),config.debug_color.tram);
	}
}

function emObtainFailedFunction(err){
	//Socket Message
	func.msg("Tram : Error obtaining emergency message for stop " + this.stop, config.debug_color.error);
}

/**
 * Other Data
 */

function getOtherData(){
	return {
		rainfall: global.weather.rainfall,
		HKO_temp: global.weather.HKO_temp,
		HKO_hum: global.weather.HKO_hum,
	};
}

function otherDataOkay(){
	return (global.weather != null);
}