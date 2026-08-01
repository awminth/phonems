const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/serviceticket.controller');

// GET /api/reports/external-purchases - Get external purchases report
router.get('/', ticketController.getExternalPurchasesReport);

module.exports = router;
