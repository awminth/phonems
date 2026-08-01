const express = require('express');
const router = express.Router();
const paymentReportController = require('../controllers/payment-report.controller');

router.get('/summary', paymentReportController.getPaymentSummary);

module.exports = router;
