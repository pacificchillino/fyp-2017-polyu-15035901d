exports.fixTime = function(from, to){
	global.db.collection("data_tram_" + from + "_" + to).find({hours:{$gt: 24}}).toArray(function(err, result) {
		if (err) throw err;
		for (var i in result){
			var filter = {_id: result[i]._id};
			var newVal = result[i];
			newVal.hours = result[i].hours - 24;
			newVal.hours0 = result[i].hours0 - 24;
			newVal.hours1 = result[i].hours1 - 24;
			global.db.collection("data_tram_" + from + "_" + to).updateOne(filter, newVal, function(err, res) {
				if (err) throw err;
			});
		}
	});
};