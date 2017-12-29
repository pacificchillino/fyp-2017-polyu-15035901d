var express = require('express');
var router = express.Router();
var _ = require('underscore');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('main/index', { title: 'Travelling Time Estimation Trial Project' });
});

/** 
 * Tram
 */

var tram_view_data_controller = require('../controllers/tram_view_data_controller');
var tram_prediction_controller = require('../controllers/tram_prediction_controller');

router.get('/trams/data', tram_view_data_controller.tram_data);
router.get('/trams/data/:stopA/:stopB/:yy/:mm/:dd', tram_view_data_controller.tram_data_result);
router.get('/api/trams/data/:stopA/:stopB/:yy/:mm/:dd', tram_view_data_controller.tram_data_result_api);

router.get('/trams/data_regr', tram_view_data_controller.tram_data_regr);
router.get('/trams/data_regr/:stopA/:stopB/:yy/:mm/:dd', tram_view_data_controller.tram_data_regr_result);
router.get('/api/trams/data_regr/:stopA/:stopB/:yy/:mm/:dd', tram_view_data_controller.tram_data_regr_result_api);

router.get('/trams/pred_sect', tram_prediction_controller.tram_pred_sect);
router.get('/trams/pred_sect/:stopA/:stopB', tram_prediction_controller.tram_pred_sect_result);
router.get('/trams/pred', tram_prediction_controller.tram_pred);

//The end
module.exports = router;