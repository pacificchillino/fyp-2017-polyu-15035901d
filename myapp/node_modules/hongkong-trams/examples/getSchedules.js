var HongKongTram = require('../index');
var tram = new HongKongTram();

/** Get Schedule Info **/
tram.getSchedules().then(function(schedules) {
  console.log('Getting Schedules for all trams');
  console.log(JSON.stringify(schedules,null,2));
}).catch(function(err) {
  console.error(err);
});
