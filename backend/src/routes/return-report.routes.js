const express = require('express');
const router = express.Router();
const returnReportController = require('../controllers/return-report.controller');

// GET /api/reports/return - Get return reports
router.get('/', returnReportController.getReturnReports);

// GET /api/reports/return/:vno - Get voucher details by VNO
router.get('/:vno', returnReportController.getVoucherDetailsByVNO);

module.exports = router;

