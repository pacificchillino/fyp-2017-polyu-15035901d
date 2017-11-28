var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
	res.render('debug',{title: "Debug"});
});

var fixTime = require("../include/fixtime-20171128.js");

router.get('/fixtime/:from/:to', function(req, res, next) {
	fixTime.fixTime(req.params.from, req.params.to);
	res.render('index',{title: "Fix Time"});
});

module.exports = router;
