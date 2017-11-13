var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* Tram Test */
var HongKongTrams = require("hongkong-trams");
var trams = HongKongTrams();

var etaeta;

trams.getNextTramETA("92W").then(function(eta){
  etaeta = eta;
});

router.get('/trams/eta/:stop', function(req, res) {
  res.json(etaeta);
});

//The end
module.exports = router;
