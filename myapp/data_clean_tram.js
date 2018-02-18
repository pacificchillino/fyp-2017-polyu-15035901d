var config = require("./config.js");
var func = require("./func.js");

/**
 * Do data cleaning on all sections:
 * - a tram that leaves later should not arrive earlier
 */

var cleaningPointer = -1;
var cleaningTotal = config.tram_est_sections.length;

var doCleaningOfASection2 = function(){
	//Connect to database
	if (global.db != null){
		//for (var i in config.tram_est_sections){
			var _obj = config.tram_est_sections[cleaningPointer];
			var stopA = (_obj.from_alt != null) ? _obj.from_alt : _obj.from;
			var stopB = (_obj.to_alt != null) ? _obj.to_alt : _obj.to;
			var sort = {date: 1, hours: 1};
			var db_table = "data_tram_" + stopA + "_" + stopB;
			global.db.collection(db_table).find({}).sort(sort).toArray(doCleaningOfASection.bind(
				{stopA: stopA, stopB: stopB, db_table: db_table}
			));
		//}
	}
};

var doCleaningOfASection = function(err, result) {
	if (err) throw err;
	if(result.length > 0){
		//Socket Message
		if (cleaningPointer == 0){
			func.msg("Tram : Data cleaning starts.", config.debug_color.tram2);
		}
		//Find entries that are leaves later than the next entry
		var i = 0;
		var IDs = [];
		while(i < result.length){
			var i = parseInt(i);
			var myID = result[i]._id;
			var myDate = result[i].date;
			var myLeavingTime = result[i].hours + result[i].tt_mins / 60;
			if (myLeavingTime < config.hour_date_turnover) myLeavingTime += 24;
			var toClean = false;
			//Find next entries that have the same date, but earlier leaving time
			var flag = true;
			var j = i;
			while (flag){
				j++;
				if (j == result.length){
					flag = false;
				}else{
					var hisID = result[j]._id;
					var hisDate = result[j].date;
					var hisLeavingTime = result[j].hours + result[j].tt_mins / 60;
					if (hisLeavingTime < config.hour_date_turnover) hisLeavingTime += 24;
					//Checking
					if (myDate != hisDate){
						flag = false;
					}else if (myLeavingTime < hisLeavingTime){
						flag = false;
					}else{
						var toClean = true;
					}
				}
			}
			//Clean up
			if (toClean){
				for (var n = i; n < j; n++){
					IDs.push(result[n]._id);
				}
			}
			//Jump
			i = j;
		}
		//Remove Data
		console.log("Tram : ["+this.stopA+"->"+this.stopB+"] " + IDs.length);
		global.db.collection(this.db_table).remove({_id:{$in: IDs}});
		//Increment Pointer
		cleaningPointer++;
		//Socket Message
		var msg = "Tram : ["+this.stopA+"->"+this.stopB+"] Data cleaning done for this section. " + IDs.length + " entries are removed."; 
		msg += " (" + cleaningPointer +" of " + cleaningTotal + ")";
		func.msg(msg, config.debug_color.tram2);
		//Update Next
		if (cleaningPointer < cleaningTotal){
			doCleaningOfASection2();
		}else{
			cleaningPointer = -1;
			//Socket Message
			func.msg("Tram : Data cleaning ends.", config.debug_color.tram2);
		}
	}
}

exports.doCleaning = function(){
	if (cleaningPointer == -1){
		//Prevent from interrupting
		cleaningPointer = 0;
		doCleaningOfASection2();
	}
}