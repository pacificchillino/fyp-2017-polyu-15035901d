var func = require("../func.js");

var data = {};
var i = -1;
var length = 0;
var from = "";
var to = "";

exports.fix = function($from, $to){
	var filter = {PH: {$exists: false}};
	global.db.collection("data_tram_" + $from + "_" + $to).find(filter).toArray(function(err, result) {
		if (err) throw err;
		if (i == -1 && result.length > 0){
			data = result;
			i = 0;
			length = result.length;
			from = $from;
			to = $to;
			func1();
		}
	});
};

var func1 = function(){
	if (i % 100 == 0){
		func.msg("20171226 Fix: "+i+"/"+length);
		console.log(i+"/"+length);
	}
	var filter = {_id: data[i]._id};
	var newVal = data[i];
	if (data[i].dayOfWk != 6 && !data[i].wkday){
		newVal.PH = true;
	}else{
		newVal.PH = false;
	}
	//
	global.db.collection("data_tram_" + from + "_" + to).updateOne(filter, newVal, func2);
}

var func2 = function(err, res){
	i++;
	if (i < length){
		func1();
	}else{
		func.msg("20171226 Fix: Done");
		console.log("Done");
		i = -1;
	}
}