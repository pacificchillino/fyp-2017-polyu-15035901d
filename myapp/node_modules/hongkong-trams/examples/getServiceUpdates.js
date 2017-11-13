var HongKongTram = require('../index');
var tram = new HongKongTram();

/** Get Service Updates **/
tram.getServiceUpdates().then(function(serviceUpdates) {
  console.log('Getting Service Updates');
  console.log(serviceUpdates);
}).catch(function(err) {
  console.error(err);
});
