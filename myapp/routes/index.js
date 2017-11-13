var express = require('express');
var router = express.Router();
var _ = require('underscore');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* Tram Test */
var HongKongTrams = require("hongkong-trams");
var trams = new HongKongTrams();

//-- ETA
router.get('/trams/eta/:stop', function(req, res) {
  trams.getNextTramETA(req.params.stop).then(function(data) {
    res.json(data);
  }).catch(function(err) {
    console.error(err);
  });
});
//-- Stops
router.get('/trams/stops', function(req,res){
  trams.getTramStops().then(function(data) {
    for (var i in data){
      data[i] = data[i].stop_code;
    }
    _.uniq(data);
    data.sort();
    res.json(data);
  }).catch(function(err) {
    console.error(err);
  });
});
//-- Service Updates
router.get('/trams/updates', function(req,res){
  trams.getServiceUpdates().then(function(data) {
    res.json(data);
  }).catch(function(err) {
    console.error(err);
  });
});
//-- Emergency Message (EM)
router.get('/trams/em/:stop', function(req,res){
  trams.getEmergencyMessageForTramStop(req.params.stop).then(function(data) {
    res.json(data);
  }).catch(function(err) {
    console.error(err);
  });
});

//Weather Test
var HongKongWeather = require('hongkong-weather');
var weather = new HongKongWeather();
router.get('/weather', function(req,res){
  weather.getCurrent().then(function(data){
    res.json(data);
  }).catch(console.error);
});

//The end
module.exports = router;
