var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
	res.render('test/debug',{title: "Debug"});
});

var fixing_20171226 = require("../include/fixing-20171226.js");

router.get('/fixing-20171226/:from/:to', function(req, res, next) {
	fixing_20171226.fix(req.params.from, req.params.to);
	res.send("Fix 20171226");
});

module.exports = router;
