const express = require('express');
const router = express.Router();
const purchaseController = require('../controllers/purchase.controller');

// GET /api/purchases/dropdowns - Get dropdown options (categories, suppliers)
router.get('/dropdowns', purchaseController.getDropdownOptions);

// GET /api/purchases - Get all purchases with pagination
router.get('/', purchaseController.getPurchases);

// GET /api/purchases/:id - Get single purchase
router.get('/:id', purchaseController.getPurchaseById);

// POST /api/purchases - Create new purchase
router.post('/', purchaseController.createPurchase);

// PUT /api/purchases/:id - Update purchase
router.put('/:id', purchaseController.updatePurchase);

// DELETE /api/purchases/:id - Delete purchase
router.delete('/:id', purchaseController.deletePurchase);

module.exports = router;

