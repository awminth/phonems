const express = require('express');
const router = express.Router();
const serviceReportController = require('../controllers/service-report.controller');

router.get('/', serviceReportController.getServiceReport);

module.exports = router;
