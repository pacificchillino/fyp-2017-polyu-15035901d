var _ = require('underscore');
var HongKongTram = require('../index');
var tram = new HongKongTram();

var tramStop = '92W';

/** Get ETA for specific tram stop **/
tram.getNextTramETA(tramStop).then(function(data) {
  console.log('Finding Next Tram ETA for tram stop', tramStop);
  console.log(data);
}).catch(function(err) {
  console.error(err);
});

/** List all tram ETAs **/
tram.getTramStops().then(function(tramStops) {
  console.log('Finding Next Tram ETA for all tram stops');
  _.each(tramStops, function(tramStop) {
    tram.getNextTramETA(tramStop.stop_code).then(function(eta) {
      console.log(eta);
    }).catch(function(err) {
      console.error(err);
    });
  });
}).catch(function(err) {
  console.error(err);
});
