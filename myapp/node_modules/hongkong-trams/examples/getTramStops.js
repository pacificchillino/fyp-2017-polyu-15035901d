var HongKongTram = require('../index');
var tram = new HongKongTram();

console.log('Getting a list of all tram stops');

/** Download a list of all tram stops**/
tram.getTramStops().then(function(tramStops) {
  console.log(tramStops);
}).catch(function(err) {
  console.error(err);
});
