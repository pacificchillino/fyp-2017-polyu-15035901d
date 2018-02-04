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
//var tram_prediction_controller = require('../controllers/tram_prediction_controller');

router.get('/trams/view_data', tram_view_data_controller.tram_data);
router.get('/trams/view_data/:stopA/:stopB/:yy/:mm/:dd', tram_view_data_controller.tram_data_result);
router.get('/trams/predict_exist', tram_view_data_controller.tram_data_predict_exist);
router.get('/trams/predict_exist/:stopA/:stopB/:yy/:mm/:dd/:model', tram_view_data_controller.tram_data_predict_exist_result);
router.get('/trams/predict_week', tram_view_data_controller.tram_data_predict_week);
router.get('/trams/predict_week/:stopA/:stopB/:yy/:mm/:dd/:model', tram_view_data_controller.tram_data_predict_week_result);

//API
router.get('/api/trams/view_data/:stopA/:stopB/:yy/:mm/:dd', tram_view_data_controller.tram_data_result_api);
router.get('/api/trams/predict_exist/:stopA/:stopB/:yy/:mm/:dd/:model', tram_view_data_controller.tram_data_predict_exist_result_api);
router.get('/api/trams/predict_week/:stopA/:stopB/:yy/:mm/:dd/:model', tram_view_data_controller.tram_data_predict_week_result_api);

router.get('/api/list/tram_sections', tram_view_data_controller.tram_sections_api);
router.get('/api/list/prediction_models', function(req, res){
	res.send(JSON.stringify(global.prediction.getModelAndModes()));
});

//The end
module.exports = router;