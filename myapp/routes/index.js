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

router.get('/trams/data_regression', tram_view_data_controller.tram_data_regr);
router.get('/trams/data_regression/:stopA/:stopB/:yy/:mm/:dd', tram_view_data_controller.tram_data_regr_result);
router.get('/api/trams/data_regression/:stopA/:stopB/:yy/:mm/:dd', tram_view_data_controller.tram_data_regr_result_api);

router.get('/trams/prediction_section', tram_prediction_controller.tram_pred_sect);
router.get('/trams/prediction_section/:stopA/:stopB', tram_prediction_controller.tram_pred_sect_result);

router.get('/trams/prediction', tram_prediction_controller.tram_pred);
router.get('/trams/prediction/:from/:to/:multi', tram_prediction_controller.tram_pred_result);
router.get('/api/trams/prediction/:from/:to/:multi', tram_prediction_controller.tram_pred_result_api);

router.get('/api/trams/prediction/from_to', tram_prediction_controller.tram_pred_from_to_api);
router.get('/api/trams/prediction/from_to.js', tram_prediction_controller.tram_pred_from_to_api_js);
router.get('/api/trams/prediction/def_data', tram_prediction_controller.tram_pred_def_data_api);
router.get('/api/trams/prediction/def_data.js', tram_prediction_controller.tram_pred_def_data_api_js);

//The end
module.exports = router;