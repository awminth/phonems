const express = require('express');
const router = express.Router();
const { getBrandAnalytics, getBranchComparisonAnalytics, getDropdowns } = require('../controllers/brand-analytics.controller');

// GET /api/reports/brand-analytics - Get sales analytics by brand
router.get('/', getBrandAnalytics);

// GET /api/reports/brand-analytics/branch-comparison - Get sales comparison by branch
router.get('/branch-comparison', getBranchComparisonAnalytics);

// GET /api/reports/brand-analytics/dropdowns - Get filter dropdowns
router.get('/dropdowns', getDropdowns);

module.exports = router;
