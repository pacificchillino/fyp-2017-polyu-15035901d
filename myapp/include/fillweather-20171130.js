exports.fillWeather = function(from, to){
	global.db.collection("data_tram_" + from + "_" + to).find({rainfall:null}).toArray(function(err, result) {
		if (err) throw err;
		console.log(result);
		for (var i in result){
			var filter = {_id: result[i]._id};
			var newVal = result[i];
			newVal.rainfall = 0;
			global.db.collection("data_tram_" + from + "_" + to).updateOne(filter, newVal, function(err, res) {
				if (err) throw err;
			});
		}
	});
};