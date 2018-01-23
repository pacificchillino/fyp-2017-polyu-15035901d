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
 * /test/regr_test/:stopA/:stopB
 * /test/regr_update
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

//Tram Cleaning
var data_update_tram = require("../data_update_tram.js");
router.get('/test/tram_update', function(req,res){
	data_update_tram.doCleaning();
	res.send("Do cleaning.");
});

//The end
module.exports = router;