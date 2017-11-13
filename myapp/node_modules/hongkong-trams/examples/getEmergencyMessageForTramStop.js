var _ = require('underscore');
var HongKongTram = require('../index');
var tram = new HongKongTram();

var tramStop = 'KTT';

/** Get Special Messages for specific tram stop **/
tram.getEmergencyMessageForTramStop(tramStop).then(function(data) {
  console.log('Finding Emergency Messages for tram stop', tramStop);
  console.log(data);
}).catch(function(err) {
  console.error(err);
});

/** Get Special Messages for all Tram Stops **/
tram.getTramStops().then(function(tramStops) {
  console.log('Finding Emergency Messages for all tram stops');
  _.each(tramStops, function(tramStop) {
    tram.getEmergencyMessageForTramStop(tramStop.stop_code).then(function(data) {
      if (data.length > 0) {
        console.log(data);
      }
    }).catch(function(err) {
      console.error(err);
    });
  });
}).catch(function(err) {
  console.error(err);
});
