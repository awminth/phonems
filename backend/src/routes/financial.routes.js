const express = require('express');
const router = express.Router();
const financialController = require('../controllers/financial.controller');

// Get financial summary (totals)
router.get('/summary', financialController.getFinancialSummary);

// Get financial details (breakdown)
router.get('/details', financialController.getFinancialDetails);

module.exports = router;

