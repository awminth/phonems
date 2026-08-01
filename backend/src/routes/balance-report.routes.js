const express = require('express');
const router = express.Router();
const balanceReportController = require('../controllers/balance-report.controller');

// GET /api/reports/balance/payable - Get payable report
router.get('/payable', balanceReportController.getPayableReport);

// GET /api/reports/balance/receivable - Get receivable report
router.get('/receivable', balanceReportController.getReceivableReport);

// GET /api/reports/balance/payable/:id/history - Get supplier history
router.get('/payable/:id/history', balanceReportController.getSupplierHistory);

// GET /api/reports/balance/receivable/:id/history - Get customer history
router.get('/receivable/:id/history', balanceReportController.getCustomerHistory);

module.exports = router;

