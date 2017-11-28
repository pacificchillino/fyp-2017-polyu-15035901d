var express = require('express');
var router = express.Router();
var _ = require('underscore');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/** 
 * Tram
 */

var tram_controller = require('../controllers/tram_controller');

router.get('/trams/data', tram_controller.tram_data);
router.get('/trams/data/:stopA/:stopB', tram_controller.tram_data_result);
router.get('/api/trams/data/:stopA/:stopB', tram_controller.tram_data_result_api);

//The end
module.exports = router;