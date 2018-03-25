var express = require('express');
var router = express.Router();
var func = require("../func.js");

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('main/index', { title: 'Travelling Time Estimation Trial Project' });
});

/** 
 * Tram
 */

var tram_view_data_controller = require('../controllers/tram_view_data_controller');
var tram_prediction_controller = require('../controllers/tram_prediction_controller');
var tram_predictor_detail_controller = require('../controllers/tram_predictor_detail_controller');

router.get('/trams/view_data', tram_view_data_controller.tram_data);
router.get('/trams/view_data/:stopA/:stopB/:yy/:mm/:dd', tram_view_data_controller.tram_data_result);

router.get('/trams/predict_exist', tram_view_data_controller.tram_data_predict_exist);
router.get('/trams/predict_exist/:stopA/:stopB/:yy/:mm/:dd/:model', tram_view_data_controller.tram_data_predict_exist_result);

router.get('/trams/predict_week', tram_view_data_controller.tram_data_predict_week);
router.get('/trams/predict_week/:stopA/:stopB/:yy/:mm/:dd/:model', tram_view_data_controller.tram_data_predict_week_result);

router.get('/trams/predict_sect', tram_prediction_controller.tram_data_predict_sect);
router.get('/trams/predict_sect/:stopA/:stopB', tram_prediction_controller.tram_data_predict_sect_result);

router.get('/trams/predict', tram_prediction_controller.tram_data_predict);
router.get('/trams/predict/:from/:to/:isMulti', tram_prediction_controller.tram_data_predict_result);

router.get('/trams/predict_eta', tram_prediction_controller.tram_data_predict_eta);
router.get('/trams/predict_eta/:stop_name', tram_prediction_controller.tram_data_predict_eta_result);

router.get('/trams/predictor_detail', tram_predictor_detail_controller.tram_data_predictor_detail);
router.get('/trams/predictor_detail/:stopA/:stopB/:model', tram_predictor_detail_controller.tram_data_predictor_detail_result);

//API
router.get('/api/trams/view_data/:stopA/:stopB/:yy/:mm/:dd', tram_view_data_controller.tram_data_result_api);
router.get('/api/trams/predict_exist/:stopA/:stopB/:yy/:mm/:dd/:model', tram_view_data_controller.tram_data_predict_exist_result_api);

router.get('/api/trams/predict_sect/:stopA/:stopB', tram_prediction_controller.tram_data_predict_sect_result_api);
router.get('/api/trams/predict_sect/:stopA/:stopB/:model', tram_prediction_controller.tram_data_predict_sect_result_api_m1);
router.get('/api/trams/predict_sect/:stopA/:stopB/:model/:mode', tram_prediction_controller.tram_data_predict_sect_result_api_m2);

router.get('/api/trams/predict/:from/:to/:isMulti', tram_prediction_controller.tram_data_predict_result_api);
router.get('/api/trams/predict/:from/:to/:isMulti/:model', tram_prediction_controller.tram_data_predict_result_api_m1);
router.get('/api/trams/predict/:from/:to/:isMulti/:model/:mode', tram_prediction_controller.tram_data_predict_result_api_m2);

router.get('/api/trams/predict_eta/:stop_name', tram_prediction_controller.tram_data_predict_eta_result_api);
router.get('/api/trams/predict_eta/:stop_name/:model', tram_prediction_controller.tram_data_predict_eta_result_api_m1);
router.get('/api/trams/predict_eta/:stop_name/:model/:mode', tram_prediction_controller.tram_data_predict_eta_result_api_m2);

router.get('/api/list/tram_sections', function(req, res){
	res.send(JSON.stringify({list: global.tramSectionsList}));
});
router.get('/api/list/prediction_models', function(req, res){
	res.send(JSON.stringify({list: global.prediction.getModelAndModes()}));
});
router.get('/api/list/tram_prediction_menu', function(req, res){
	res.send(JSON.stringify({list: global.tramPredictionServiceMenu}));
});
router.get('/api/list/tram_prediction_menu/:from', function(req, res){
	res.send(JSON.stringify({list: func.emptyObjectIfNull(global.tramPredictionServiceMenu[req.params.from])}));
});
router.get('/api/list/tram_prediction_menu_from', function(req, res){
	res.send(JSON.stringify({list: global.tramPredictionServiceMenu_fromList}));
});
router.get('/api/list/tram_eta_menu', function(req, res){
	res.send(JSON.stringify({list: global.tramETAServiceMenu}));
});

//The end
module.exports = router;