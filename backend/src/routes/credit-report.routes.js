const express = require('express');
const router = express.Router();
const creditReportController = require('../controllers/credit-report.controller');

// GET /api/reports/credit - Get credit reports
router.get('/', creditReportController.getCreditReports);

// GET /api/reports/credit/payments/:vno - Get payment details by VNO
router.get('/payments/:vno', creditReportController.getPaymentDetailsByVNO);

// GET /api/reports/credit/:vno - Get voucher details by VNO
router.get('/:vno', creditReportController.getVoucherDetailsByVNO);

module.exports = router;

