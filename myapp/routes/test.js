var express = require('express');
var router = express.Router();
var _ = require('underscore');

/* Tram Test */
var HongKongTrams = require("../include/hongkong-trams.js");
var trams = new HongKongTrams();

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
router.get('/test/trams/eta/:stop', function(req, res) {
  trams_eta_bystop(req, res, false);
});
//-- ETA for all stops
function trams_eta_all(req, res, isJSON){
	var data = new Object();
    var promises = new Array();
    var etaFunction = function(eta){
      data[this.stopCode].eta = eta;
    }
    trams.getTramStops().then(function(stops) {
      _.each(stops, function(stop) {
        var stopCode = stop.stop_code;
        data[stopCode] = stop;
        promises.push(trams.getNextTramETA(stopCode)
        .then(etaFunction.bind({stopCode: stopCode}))
        .catch(function(err) {
		  data[stopCode].eta = {};
          console.error(err);
        }));
      });
      //Output
      Promise.all(promises).then(function(){
        if (isJSON){
			res.setHeader('Content-Type', 'application/json');
			res.send(JSON.stringify(data), null, 3);
		}else{
			res.render('/test/tram-eta-all', {title: 'Tram ETAs', data: data});
		}
      });
    }).catch(function(err) {
      console.error(err);
    });
}
router.get('/test/api/trams/eta', function(req, res) {
  trams_eta_all(req, res, true);
});
router.get('/test/trams/eta', function(req, res) {
  trams_eta_all(req, res, false);
});
//-- Stops
router.get('/test/api/trams/stops', function(req,res){
  trams.getTramStops().then(function(data) {
    for (var i in data){
      data[i] = data[i].stop_code;
    }
    _.uniq(data);
    data.sort();
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(data), null, 3);
  }).catch(function(err) {
    console.error(err);
  });
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

//The end
module.exports = router;