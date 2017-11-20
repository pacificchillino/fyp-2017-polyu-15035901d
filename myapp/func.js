var config = require("./config.js");

/**
 * Emit socket data for debug
 */
exports.socketMsg = function(message, color){
	if (color == null) color = "black"; //Defalt color
		if (global.io != null){
			var data = {
				message: message,
				color: color,
				date: new Date(),
			};
			global.io.emit('msg', data);
		}
}