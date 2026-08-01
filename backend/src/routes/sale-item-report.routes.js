const express = require('express');
const router = express.Router();
const saleItemReportController = require('../controllers/sale-item-report.controller');

router.get('/', saleItemReportController.getSaleItemsReport);

module.exports = router;
