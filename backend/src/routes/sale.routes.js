const express = require('express');
const router = express.Router();
const saleController = require('../controllers/sale.controller');

// POST /api/sales/checkout - Process checkout
router.post('/checkout', saleController.processCheckout);

// GET /api/sales/vouchers - Get all vouchers
router.get('/vouchers', saleController.getVouchers);

// GET /api/sales/vouchers/next-vno - Get next VNO
router.get('/vouchers/next-vno', saleController.getNextVNO);

// GET /api/sales/vouchers/:vno - Get voucher details
router.get('/vouchers/:vno', saleController.getVoucherDetails);

module.exports = router;

