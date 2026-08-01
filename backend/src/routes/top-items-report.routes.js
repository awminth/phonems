const express = require('express');
const router = express.Router();
const {
  getTopItems,
  getDropdowns,
  getItemDetail
} = require('../controllers/top-items-report.controller');

// GET /api/reports/top-items - Get top selling items (grouped by RemainID)
router.get('/', getTopItems);

// GET /api/reports/top-items/dropdowns - Get dropdowns for filters
router.get('/dropdowns', getDropdowns);

// GET /api/reports/top-items/:remainId - Get item detail (sale history)
router.get('/:remainId', getItemDetail);

module.exports = router;

