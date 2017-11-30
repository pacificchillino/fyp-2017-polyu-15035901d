/**
 * Tram Recorder:
 * new TramRecorder(_index, _stopA, _stopB, _stopB2)
 * TramRecorder.feedData(params)
 * TramRecorder.markTramsEntry(dataA, otherData, medianTime)
 * TramRecorder.markTramsLeave(dataB, otherData)
 * TramRecorder.aTramEnters(dataA, tram_id, dest, timestamp, otherData)
 * TramRecorder.aTramLeaves(dataB, tram_id, timestamp, otherData)
 * TramRecorder.getCorrespondingRainfall(weatherData)
 * TramRecorder.clearExpired()
 * TramRecorder.restart()
 */

var config = require("./config.js");
var func = require("./func.js");
var _ = require('underscore');

//Constructor Function

function TramRecorder(_index, _stopA, _stopB, _stopB2) {
	//Initialize
	this.index = _index;
	this.stopA = _stopA;
	this.stopA$ = _stopA.split("_")[0];
	this.stopA_isTerminus = config.tram_stops_for_eta[_stopA].isTerminus;
	this.stopB = _stopB;
	this.stopB$ = _stopB.split("_")[0];
	if (_stopB2 != null){
		this.stopB2 = _stopB2;
	}
	if (config.tram_est_sections[_index].notVia != null){
		this.notVia = config.tram_est_sections[_index].notVia;
	}else{
		this.notVia = [];
	}
	this.time_upper_limit = config.tram_est_sections[_index].time_upper_limit;
	this.time_lower_limit = config.tram_est_sections[_index].time_lower_limit;
	this.rainfallStations = config.tram_est_sections[_index].rainfall;
	this.rainfallNow = null;
	this.destLimits = config.tram_est_sections[_index].dest;
	this.trams = {}; //e.g. this.trams["155"] = {time: [timestamp], rainfall: 0}
}

//Feed Data for Stop A (start of the section)

TramRecorder.prototype.feedData = function(params) {
	/*
		Params:
		type: A / B
		tramData
		tramData2
		otherData
	*/
	//Translate tramData to format: {dest: "NPT", tram_no: "155", dest: "NPT", eta: [Timestamp], eta2: [Date], arrived: false}
	var tramDataNew = {now: [], prev: []};
	for (var i in params.tramData.now){
		var etaValue = params.tramData.nowTime.getTime() + params.tramData.now[i].arrive_in_second * 1000;
		tramDataNew.now.push({
			dest: params.tramData.now[i].dest_stop_code,
			tram_no: params.tramData.now[i].tram_id,
			eta: etaValue,
			eta2: func.getHMSOfDay(new Date(etaValue)),
			eta_sec: params.tramData.now[i].arrive_in_second,
			arrived: params.tramData.now[i].is_arrived,
		});
	}
	if (params.tramData.prevTime == null){
		tramDataNew.prev = null;
	}else{
		for (var i in params.tramData.prev){
			var etaValue = params.tramData.prevTime.getTime() + params.tramData.prev[i].arrive_in_second * 1000;
			tramDataNew.prev.push({
				dest: params.tramData.prev[i].dest_stop_code,
				tram_no: params.tramData.prev[i].tram_id,
				eta: etaValue,
				eta2: func.getHMSOfDay(new Date(etaValue)),
				eta_sec: params.tramData.prev[i].arrive_in_second,
				arrived: params.tramData.prev[i].is_arrived,
			});
		}
	}
	//For tramData2
	if (params.tramData2 != null){
		for (var i in params.tramData2.now){
			var etaValue = params.tramData2.nowTime.getTime() + params.tramData2.now[i].arrive_in_second * 1000;
			tramDataNew.now.push({
				dest: params.tramData2.now[i].dest_stop_code,
				tram_no: params.tramData2.now[i].tram_id,
				eta: etaValue,
				eta2: func.getHMSOfDay(new Date(etaValue)),
				eta_sec: params.tramData2.now[i].arrive_in_second,
				arrived: params.tramData2.now[i].is_arrived,
			});
		}
		if (params.tramData2.prevTime == null){
			tramDataNew.prev = null;
		}else{
			for (var i in params.tramData2.prev){
				var etaValue = params.tramData2.prevTime.getTime() + params.tramData2.prev[i].arrive_in_second * 1000;
				tramDataNew.prev.push({
					dest: params.tramData2.prev[i].dest_stop_code,
					tram_no: params.tramData2.prev[i].tram_id,
					eta: etaValue,
					eta2: func.getHMSOfDay(new Date(etaValue)),
					eta_sec: params.tramData2.prev[i].arrive_in_second,
					arrived: params.tramData2.prev[i].is_arrived,
				});
			}
		}
	}
	//Mark Median Time
	if (params.tramData.prevTime != null){
		var medianTime = (params.tramData.nowTime.getTime() + params.tramData.prevTime.getTime()) / 2;
	}else{
		var medianTime = -1;
	}
	//Send to another function
	if (params.type == "A"){
		this.markTramsEntry(tramDataNew, params.otherData, medianTime);
	}else if (params.type == "B"){
		this.markTramsLeave(tramDataNew, params.otherData);
	}else if (params.type == "V"){
		this.markTramsNotVia(tramDataNew);
	}
};

/* Mark Tram Entry from Data A
For A isTerminus = true (A is a terminus):
> Tram X is within the set of destinations
> > Tram X is found in PREV
> > > Tram X is NOT found in NOW (if the first element fulfils, check the second element, and so on)
> > > > Ok. Tram X enters section at medianTime
For A isTerminus = false (A is no a terminus):
[Case 1]
> Tram X is within the set of destinations
> > Tram X is found and arrived in NOW
> > > Ok. Tram X enters section at NOW_ETA
[Case 2]
> Tram X is within the set of destinations
> > Tram X is found but has not arrived in PREV
> > > Tram X is NOT found in NOW
> > > > It is within the time threshold
> > > > > Ok. Tram X enters section at PREV_ETA
*/

TramRecorder.prototype.markTramsEntry = function(dataA, otherData, medianTime){ //medianTime could be -1
	//isTerminus: true
	if (this.stopA_isTerminus){
		if (dataA.prev != null){
			//List all trams in PREV
			var lastFlag = true;
			for (var i = 0 ; i < dataA.prev.length; i++){
				var theTram = dataA.prev[i].tram_no;
				var theDest = dataA.prev[i].dest;
				var flag = true;
				//If the last flag is false, don't do anything
				flag = flag && lastFlag;
				//If the tram is within the set of destinations
				flag = flag && (_.indexOf(this.destLimits, theDest) != -1);
				//If the tram is NOT found in NOW
				flag = flag && (_.findIndex(dataA.now, {tram_no: theTram}) == -1);
				//The tram enters section at medianTime
				if (flag && medianTime != -1){
					this.aTramEnters(dataA, theTram, theDest, medianTime, otherData);
				}
				lastFlag = flag;
			}
		}
	}
	//isTerminus: false
	else{
		//Case 1-----------------------------------------------------
		//Find all arrived trams in NOW
		for (var i in dataA.now){
			var theTram = dataA.now[i].tram_no;
			var theDest = dataA.now[i].dest;
			var flag = true;
			//Check if tram has arrived
			flag = flag && (dataA.now[i].arrived);
			//If the tram is within the set of destinations
			flag = flag && (_.indexOf(this.destLimits, theDest) != -1);
			//The tram enters section at NOW_ETA
			if (flag){
				this.aTramEnters(dataA, theTram, theDest, dataA.now[i].eta, otherData);
			}
		}
		//Case 2-----------------------------------------------------
		if (dataA.prev != null){
			//List all trams in PREV
			for (var i = 0 ; i < dataA.prev.length; i++){
				var theTram = dataA.prev[i].tram_no;
				var theDest = dataA.prev[i].dest;
				var flag = true;
				//If the tram has not arrived
				flag = flag && (!dataA.prev[i].arrived);
				//If PREV_ETA is within the ETA limit
				flag = flag && (dataA.prev[i].eta_sec < config.tram_eta_nonarrived_limit);
				//If the tram is within the set of destinations
				flag = flag && (_.indexOf(this.destLimits, theDest) != -1);
				//If the tram is NOT found in NOW
				flag = flag && (_.findIndex(dataA.now, {tram_no: theTram}) == -1);
				//The tram enters section at PREV_ETA
				if (flag){
					this.aTramEnters(dataA, theTram, theDest, dataA.prev[i].eta, otherData);
				}
			}
		}
	}
};

/* Mark Tram Leave from Data B
[Case 1]
> Tram X is found and arrived in NOW
> > Ok. Tram X leaves section at NOW_ETA
[Case 2]
> Tram X is found but has not arrived in PREV
> > Tram X is NOT found in NOW
> > > It is within the time threshold
> > > > Ok. Tram X leaves section at PREV_ETA
[Also check]
If record of tram entering does not exist --> fail
If the leavning time is too long from entering time --> fail
*/

TramRecorder.prototype.markTramsLeave = function(dataB, otherData){
	//Case 1-----------------------------------------------------
	//Find all arrived trams in NOW
	for (var i in dataB.now){
		var theTram = dataB.now[i].tram_no;
		//The tram enters section at NOW_ETA
		if (dataB.now[i].arrived){
			this.aTramLeaves(dataB, theTram, dataB.now[i].eta);
		}
	}
	//Case 2-----------------------------------------------------
	if (dataB.prev != null){
		//List all trams in PREV
		for (var i = 0 ; i < dataB.prev.length; i++){
			var theTram = dataB.prev[i].tram_no;
			var flag = true;
			//If the tram has not arrived
			flag = flag && (!dataB.prev[i].arrived);
			//If PREV_ETA is within the ETA limit
			flag = flag && (dataB.prev[i].eta_sec < config.tram_eta_nonarrived_limit);
			//If the tram is NOT found in NOW
			flag = flag && (_.findIndex(dataB.now, {tram_no: theTram}) == -1)
			//The tram enters section at PREV_ETA
			if (flag){
				this.aTramLeaves(dataB, theTram, dataB.prev[i].eta);
			}
		}
	}
};


TramRecorder.prototype.aTramEnters = function(dataA, tram_id, dest, timestamp, otherData){
	var date = new Date(timestamp);
	//Check if timestamp within recording time
	if (func.isDuringTramRecordingTimeA(date)){
		var theRainfall = this.getCorrespondingRainfall(otherData.rainfall);
		this.trams[tram_id] = {time: timestamp, dest: dest, rainfall: theRainfall};
		var msg1 = "Tram : ["+this.stopA$+"->"+this.stopB$+"] #" + tram_id + " (to " + dest + ") enters this section at "
		+ func.getHMSOfDay(new Date(timestamp))
		+ ", the rainfall is " + theRainfall + " mm";
		var msg2 = "Prev: " + JSON.stringify(dataA.prev) + "<br/>" + "Now: " + JSON.stringify(dataA.now);
		func.msg2(msg1, msg2, config.debug_color.tram2);
	}
};

TramRecorder.prototype.aTramLeaves = function(dataB, tram_id, timestamp){
	var date = new Date(timestamp);
	//Check if timestamp within recording time
	if (func.isDuringTramRecordingTimeB(date)){
		//Check if the tram has entered
		if (this.trams[tram_id] != null){
			//Check if the travelling time is within the limit
			var minutesSpent = (timestamp - this.trams[tram_id].time) / 60000;
			if (minutesSpent < this.time_upper_limit && minutesSpent > this.time_lower_limit){
				//Okay, the tram leaves
				var mins = Math.round(minutesSpent * 100) / 100;
				//Update database
				this.updateDatabase(tram_id, minutesSpent);
				//Socket message
				var msg1 = "Tram : ["+this.stopA$+"->"+this.stopB$+"] #" + tram_id + " finishes this section at "
				+ func.getHMSOfDay(new Date(timestamp))
				+ ", it has spent " + mins + " mins.";
				var msg2 = "Prev: " + JSON.stringify(dataB.prev) + "<br/>" + "Now: " + JSON.stringify(dataB.now);
				func.msg2(msg1, msg2, config.debug_color.tram2);
			}
			//The end
			delete this.trams[tram_id];
		}else{
			/*//Still got a socket message
			var msg1 = "Tram : ["+this.stopA$+"->"+this.stopB$+"] #" + tram_id + " finishes this section at "
			+ func.getHMSOfDay(new Date(timestamp))
			+ ". However, its entry has not been marked.";
			func.msg(msg1, config.debug_color.tram2);*/
		}
	}
};

/**
 * Mark Trams NotVia : if a tram runs to that stop, it runs on an invalid route --> remove that tram in this section
 */

TramRecorder.prototype.markTramsNotVia = function (dataV){
	for (var i in dataV.now){
		var theTram = dataV.now[i].tram_no;
		//Remove!
		if (this.trams[theTram] != null){
			delete this.trams[theTram];
			//Socket message
			var msg1 = "Tram : Recorder ["+this.stopA$+"->"+this.stopB$+"] - Tram #" + theTram + " runs at a wrong route. Removed.";
			func.msg(msg1, config.debug_color.tram2);
		}
	}
};

//Update to database

TramRecorder.prototype.updateDatabase = function (tram_id, minsSpent){
	if (global.db != null){
		var hours = (this.trams[tram_id].time / 3600 / 1000 + config.timezone) % 24;
		//Add new data
		var data = {
			wkday: global.isWeekday,
			dayOfWk: global.dayOfWeek,
			date: global.dateStr,
			//from: this.stopA$,
			//to: this.stopB$,
			tram: tram_id,
			tt_mins: minsSpent, //In minutes
			hours: hours,
			rainfall: this.trams[tram_id].rainfall,
		};
		var time_hours_left = Math.floor(hours);
		var time_hours_right = Math.ceil(hours);
		if (time_hours_left % 2 == 0){
			//Left is even
			data.hours0 = time_hours_left;
			data.hours0off = hours - time_hours_left;
			data.hours1 = time_hours_right;
			data.hours1off = time_hours_right - hours;
		}else{
			//Left is odd
			data.hours1 = time_hours_left;
			data.hours1off = hours - time_hours_left;
			data.hours0 = time_hours_right;
			data.hours0off = time_hours_right - hours;
		}
		var tableName = "data_tram_" + this.stopA$ + "_" + this.stopB$;
		if (func.isSavingDBAllowed()){
			global.db.collection(func.getTableName(tableName)).insertOne(data,
				function(err, res) { if (err) throw err; }
			);
		}
	}
};

//Clear trams that have "stayed" in the section for too long time

TramRecorder.prototype.clearExpired = function() {
	for (var tram_id in this.trams){
		//Check if the travelling time is within the limit
		var timestamp = new Date().getTime();
		var minutesSpent = (timestamp - this.trams[tram_id].time) / 60000;
		if (minutesSpent >= this.time_upper_limit){
			delete this.trams[tram_id];
		}
	}
};

//Get Rainfall

TramRecorder.prototype.getCorrespondingRainfall = function(rainfall){
	var result = 0;
	for (var i in this.rainfallStations){
		result += rainfall[this.rainfallStations[i].district] * this.rainfallStations[i].weight;
	}
	return result;
};

//Restart recorder - date turn

TramRecorder.prototype.restart = function() {
	var msg1 = "Tram : Recorder ["+this.stopA$+"->"+this.stopB$+"] restarted.";
	func.msg(msg1, config.debug_color.tram2);
	this.trams = {};
};

TramRecorder.prototype.flush = function(){
	this.trams = {};
}

module.exports = TramRecorder;