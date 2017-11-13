var HongKongTram = require('../index');
var tram = new HongKongTram();

/** Get Fare Info **/
tram.getFares().then(function(fares) {
  console.log('Getting Fare Information');
  console.log(fares);
}).catch(function(err) {
  console.error(err);
});
