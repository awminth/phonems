const express = require('express');
const router = express.Router();
const posController = require('../controllers/pos.controller');

// GET /api/pos/categories - Get all categories for POS
router.get('/categories', posController.getCategories);

// GET /api/pos/items - Get items with pagination and category filter
router.get('/items', posController.getItems);

// GET /api/pos/items/search - Search items by code or name
router.get('/items/search', posController.searchItems);

// GET /api/pos/items/:code - Get single item by code
router.get('/items/:code', posController.getItemByCode);

// GET /api/pos/imeis/:productId - Get available IMEIs for a product
router.get('/imeis/:productId', posController.getAvailableImeis);

module.exports = router;

