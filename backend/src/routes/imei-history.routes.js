const express = require('express');
const router = express.Router();
const imeiHistoryController = require('../controllers/imei-history.controller');

router.get('/list', imeiHistoryController.getFullImeiList);
router.get('/suggestions', imeiHistoryController.getImeiSuggestions);
router.get('/:imei', imeiHistoryController.getImeiHistory);

module.exports = router;
