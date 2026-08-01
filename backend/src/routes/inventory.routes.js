const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventory.controller');
const adjustmentController = require('../controllers/adjustment.controller');

// GET /api/inventory - Get all inventory with pagination and filters
router.get('/', inventoryController.getInventory);

// GET /api/inventory/dropdowns - Get dropdown options
router.get('/dropdowns', inventoryController.getDropdownOptions);

// GET /api/inventory/low-stock - Get low stock count
router.get('/low-stock', inventoryController.getLowStockCount);

// GET /api/inventory/adjustments - Get all adjustment records
router.get('/adjustments', adjustmentController.getAdjustments);

// GET /api/inventory/selling-price-history - Get all selling price history
router.get('/selling-price-history', inventoryController.getAllSellingPriceHistory);

// GET /api/inventory/:id - Get single inventory item
router.get('/:id', inventoryController.getInventoryById);

// GET /api/inventory/:id/imei - Get IMEI list for an inventory item
router.get('/:id/imei', inventoryController.getInventoryImeis);

// GET /api/inventory/:id/price-history - Get purchase price history for an inventory item
router.get('/:id/price-history', inventoryController.getPurchasePriceHistory);



// GET /api/inventory/:id/selling-price-history - Get selling price history for a specific item
router.get('/:id/selling-price-history', inventoryController.getSellingPriceHistory);


// PUT /api/inventory/:id - Update inventory item (Qty and SellPrice only)
router.put('/:id', inventoryController.updateInventory);

// POST /api/inventory/adjust - Adjust stock
router.post('/adjust', adjustmentController.adjustStock);

// GET /api/inventory/:id/adjustments - Get adjustment history
router.get('/:id/adjustments', adjustmentController.getHistory);

module.exports = router;

