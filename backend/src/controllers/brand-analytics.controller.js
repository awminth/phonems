const pool = require('../config/database').pool;
const { cache } = require('../config/redis');

// Cache key prefix
const CACHE_PREFIX = 'brand_analytics';

// Get sales analytics grouped by brand (Category)
const getBrandAnalytics = async (req, res) => {
  try {
    const fromDate = req.query.fromDate || '';
    const toDate = req.query.toDate || '';
    const { userType, branchId: userBranchId } = req.user;

    // Branch Filtering
    const branchId = userType === 'admin' ? (req.query.branchId || 'all') : userBranchId;

    const cacheKey = `${CACHE_PREFIX}:summary:${fromDate || 'all'}:${toDate || 'all'}:${branchId || 'all'}`;

    // Try cache
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return res.json({ success: true, data: cachedData, fromCache: true });
    }

    let whereClause = '1=1';
    let params = [];

    if (branchId !== 'all') {
      whereClause += ' AND s.BranchID = ?';
      params.push(branchId);
    }

    if (fromDate) {
      whereClause += ' AND DATE(s.Date) >= ?';
      params.push(fromDate);
    }

    if (toDate) {
      whereClause += ' AND DATE(s.Date) <= ?';
      params.push(toDate);
    }

    const query = `
      SELECT 
        c.AID as brandId,
        COALESCE(c.Category, 'Uncategorized') as brandName,
        SUM(s.Qty) as totalQty,
        SUM(s.Qty * s.SellPrice) as totalAmount
      FROM tblsale s
      LEFT JOIN tblproduct r ON s.RemainID = r.AID
      LEFT JOIN tblcategory c ON r.CategoryID = c.AID
      WHERE ${whereClause}
      GROUP BY c.AID, c.Category
      ORDER BY totalAmount DESC
    `;

    const [rows] = await pool.query(query, params);

    // Add colors for the chart
    const colors = [
      '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
      '#EC4899', '#06B6D4', '#F97316', '#6366F1', '#14B8A6'
    ];
    
    const dataWithColors = rows.map((row, index) => ({
      ...row,
      fill: colors[index % colors.length]
    }));

    await cache.set(cacheKey, dataWithColors, 300); // 5 minutes

    res.json({ success: true, data: dataWithColors, fromCache: false });
  } catch (error) {
    console.error('getBrandAnalytics error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch brand analytics' });
  }
};

// Get sales analytics grouped by branch for comparison
const getBranchComparisonAnalytics = async (req, res) => {
  try {
    const fromDate = req.query.fromDate || '';
    const toDate = req.query.toDate || '';
    const brandId = req.query.brandId || 'all';

    const cacheKey = `${CACHE_PREFIX}:branch_comparison:${fromDate || 'all'}:${toDate || 'all'}:${brandId}`;

    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return res.json({ success: true, data: cachedData, fromCache: true });
    }

    let whereClause = '1=1';
    let params = [];

    if (brandId !== 'all') {
      whereClause += ' AND r.CategoryID = ?';
      params.push(brandId);
    }

    if (fromDate) {
      whereClause += ' AND DATE(s.Date) >= ?';
      params.push(fromDate);
    }

    if (toDate) {
      whereClause += ' AND DATE(s.Date) <= ?';
      params.push(toDate);
    }

    const query = `
      SELECT 
        b.AID as branchId,
        COALESCE(b.BranchName, 'Unknown') as branchName,
        SUM(s.Qty) as totalQty,
        SUM(s.Qty * s.SellPrice) as totalAmount
      FROM tblsale s
      LEFT JOIN tblproduct r ON s.RemainID = r.AID
      LEFT JOIN tblbranch b ON s.BranchID = b.AID
      WHERE ${whereClause}
      GROUP BY b.AID, b.BranchName
      ORDER BY totalAmount DESC
    `;

    const [rows] = await pool.query(query, params);

    const colors = [
      '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
      '#EC4899', '#06B6D4', '#F97316', '#6366F1', '#14B8A6'
    ];
    
    const dataWithColors = rows.map((row, index) => ({
      ...row,
      fill: colors[index % colors.length]
    }));

    await cache.set(cacheKey, dataWithColors, 300);

    res.json({ success: true, data: dataWithColors, fromCache: false });
  } catch (error) {
    console.error('getBranchComparisonAnalytics error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch branch comparison analytics' });
  }
};

// Get dropdowns for filters
const getDropdowns = async (req, res) => {
  try {
    const cacheKey = `${CACHE_PREFIX}:dropdowns`;
    
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return res.json({ success: true, data: cachedData, fromCache: true });
    }

    const [categories] = await pool.query('SELECT AID as id, Category as name FROM tblcategory ORDER BY Category');
    const [branches] = await pool.query('SELECT AID as id, BranchName as name FROM tblbranch ORDER BY BranchName');

    const result = { categories, branches };
    await cache.set(cacheKey, result, 3600); // 1 hour

    res.json({ success: true, data: result, fromCache: false });
  } catch (error) {
    console.error('getDropdowns error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dropdowns' });
  }
};

module.exports = {
  getBrandAnalytics,
  getBranchComparisonAnalytics,
  getDropdowns
};
