var express = require('express');
var router = express.Router();
var _ = require('underscore');

/* Tram Test */
var HongKongTrams = require("../include/hongkong-trams.js");
var trams = new HongKongTrams();

/**
 * Summary
 * /test/api/trams/eta/:stop
 * /test/api/trams/updates
 * /test/api/trams/em/:stop
 * /test/api/weather
 * /test/prediction/:collection/:yyyy/:mm/:dd/:model/:mode
*/

//-- ETA
function trams_eta_bystop(req, res, isJSON){
  trams.getNextTramETA(req.params.stop).then(function(data) {
    if (isJSON){
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify(data), null, 3);
    }else{
      res.render('/test/tram-eta', {title: 'Tram ETA', stop_code: this.stop_code, data: data});
    }
  }.bind({stop_code: req.params.stop})).catch(function(err) {
    console.error(err);
  });
}
router.get('/test/api/trams/eta/:stop', function(req, res) {
  trams_eta_bystop(req, res, true);
});
//-- Service Updates
router.get('/test/api/trams/updates', function(req,res){
  trams.getServiceUpdates().then(function(data) {
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(data), null, 3);
  }).catch(function(err) {
    console.error(err);
  });
});
//-- Emergency Message (EM)
router.get('/test/api/trams/em/:stop', function(req,res){
  trams.getEmergencyMessageForTramStop(req.params.stop).then(function(data) {
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(data), null, 3);
  }).catch(function(err) {
    console.error(err);
  });
});

//Weather Test
var HongKongWeather = require('../include/hongkong-weather.js');
var weather = new HongKongWeather();
router.get('/test/api/weather', function(req,res){
  weather.getCurrent().then(function(data){
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(data), null, 3);
  }).catch(console.error);
});

//Prediction Test
router.get('/test/prediction/:collection/:yyyy/:mm/:dd/:model/:mode', function(req,res){
	var mySC = req.params.collection;
	var myDate = req.params.yyyy+"/"+req.params.mm+"/"+req.params.dd;
	var myModel = req.params.model;
	var myMode = req.params.mode;
	global.db.collection(mySC).find({date: myDate}).toArray(function(err, data) {
		res.send(JSON.stringify(
			global.prediction.predict(mySC, myModel, myMode, data)
		));
	});
});

router.get('/test/prediction/init', function(req,res){
	global.prediction.init();
	res.send("Init");
});

//The end
module.exports = router;