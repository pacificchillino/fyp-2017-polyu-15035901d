var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* Tram Test */

router.get('/trams/eta/:stop', function(req, res) {
  res.json({stop: req.params.stop});
});

//The end
module.exports = router;
