const express = require('express');
const router = express.Router();
const cashReportController = require('../controllers/cash-report.controller');

// GET /api/reports/cash - Get cash reports
router.get('/', cashReportController.getCashReports);

// GET /api/reports/cash/:vno - Get voucher details by VNO
router.get('/:vno', cashReportController.getVoucherDetailsByVNO);

module.exports = router;

