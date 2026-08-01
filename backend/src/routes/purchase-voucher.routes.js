const express = require('express');
const router = express.Router();
const purchaseVoucherController = require('../controllers/purchase-voucher.controller');

// GET /api/purchase-vouchers - Get all purchase vouchers
router.get('/', purchaseVoucherController.getPurchaseVouchers);

// GET /api/purchase-vouchers/next-vno - Get next VNO
router.get('/next-vno', purchaseVoucherController.getNextVNO);

// POST /api/purchase-vouchers/upload-image - Upload item image
router.post('/upload-image', purchaseVoucherController.uploadItemImage);

// GET /api/purchase-vouchers/:id - Get purchase voucher by ID
router.get('/:id', purchaseVoucherController.getPurchaseVoucherById);

// POST /api/purchase-vouchers - Create purchase voucher
router.post('/', purchaseVoucherController.createPurchaseVoucher);

// PUT /api/purchase-vouchers/:id - Update purchase voucher
router.put('/:id', purchaseVoucherController.updatePurchaseVoucher);

// DELETE /api/purchase-vouchers/:id - Delete purchase voucher
router.delete('/:id', purchaseVoucherController.deletePurchaseVoucher);

module.exports = router;

