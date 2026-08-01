const express = require('express');
const router = express.Router();
const purchaseReturnController = require('../controllers/purchase-return.controller');

// GET /api/purchase-returns/vouchers/dropdown - Get purchase vouchers for dropdown
router.get('/vouchers/dropdown', purchaseReturnController.getPurchaseVouchersDropdown);

// GET /api/purchase-returns/invoice/:purchaseInvoiceNo - Get purchase invoice details
router.get('/invoice/:purchaseInvoiceNo', purchaseReturnController.getPurchaseInvoiceDetails);

// GET /api/purchase-returns - Get all purchase returns
router.get('/', purchaseReturnController.getPurchaseReturns);

// GET /api/purchase-returns/:id - Get purchase return by ID
router.get('/:id', purchaseReturnController.getPurchaseReturnById);

// POST /api/purchase-returns - Create purchase return
router.post('/', purchaseReturnController.createPurchaseReturn);

// PUT /api/purchase-returns/:id - Update purchase return
router.put('/:id', purchaseReturnController.updatePurchaseReturn);

// DELETE /api/purchase-returns/:id - Delete purchase return
router.delete('/:id', purchaseReturnController.deletePurchaseReturn);

module.exports = router;

