const pool = require('../config/database').pool;
const { cache } = require('../config/redis');

// Cache key prefixes
const CACHE_PREFIX_CATEGORIES = 'pos:categories';
const CACHE_PREFIX_ITEMS = 'pos:items';

// Get all categories for POS
const getCategories = async (req, res) => {
  try {
    const isSerialized = req.query.isSerialized; // '1' or '0'
    const isSparePart = req.query.isSparePart; // '1' or '0'
    const cacheKey = `${CACHE_PREFIX_CATEGORIES}:${isSerialized || 'all'}:${isSparePart || 'all'}`;
    
    // Try cache first
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        data: cachedData,
        fromCache: true
      });
    }
    
    let query = 'SELECT AID as id, Category as name FROM tblcategory';
    let params = [];
    let hasJoin = false;
    
    if (isSparePart === '1') {
      query = `SELECT DISTINCT c.AID as id, c.Category as name 
               FROM tblcategory c
               JOIN tblproduct p ON p.CategoryID = c.AID
               WHERE p.IsSparePart = 1`;
      hasJoin = true;
    } else if (isSerialized !== undefined && isSerialized !== '') {
      query = `SELECT DISTINCT c.AID as id, c.Category as name 
               FROM tblcategory c
               JOIN tblproduct p ON p.CategoryID = c.AID
               WHERE p.IsSerialized = ?`;
      if (isSerialized === '0') {
        query += ' AND p.IsService = 0 AND p.IsSparePart = 0';
      } else {
        query += ' AND p.IsSparePart = 0';
      }
      params.push(parseInt(isSerialized));
      hasJoin = true;
    }
    
    query += hasJoin ? ' ORDER BY c.Category' : ' ORDER BY Category';
    
    // Get from database
    const [rows] = await pool.query(query, params);
    
    // Cache for 5 minutes
    await cache.set(cacheKey, rows, 300);
    
    res.json({
      success: true,
      data: rows,
      fromCache: false
    });
  } catch (error) {
    console.error('getCategories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories'
    });
  }
};

// Get items for POS (from tblremain)
const getItems = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const categoryId = req.query.categoryId || null;
    const search = req.query.search || '';
    const offset = (page - 1) * limit;
    
    const isSerialized = req.query.isSerialized; // '1' for phones, '0' for others
    const isService = req.query.isService; // '1' for services
    const isSparePart = req.query.isSparePart; // '1' for spare parts

    // Build cache key
    const { userType, branchId } = req.user;
    const cacheKey = `${CACHE_PREFIX_ITEMS}:${page}:${limit}:${categoryId || 'all'}:${search}:${branchId || 'all'}:${isSerialized || 'all'}:${isService || 'all'}:${isSparePart || 'all'}`;
    
    // Try cache first
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        ...cachedData,
        fromCache: true
      });
    }
    
    // Build query
    let qtySelect = 'r.StockQty';
    let qtyParams = [];
    
    if (userType !== 'admin' && branchId) {
      qtySelect = `(
        COALESCE((SELECT SUM(quantity) FROM tblpurchase_items WHERE product_id = r.AID AND BranchID = ? AND purchase_id IS NOT NULL AND Status != 4), 0) - 
        COALESCE((SELECT SUM(pr.ReturnQty) FROM tblpurchase_return pr JOIN tblpurchase_items pi ON pr.PurchaseID = pi.p_item_id WHERE pi.product_id = r.AID AND pi.BranchID = ?), 0) -
        (
          COALESCE((SELECT SUM(Qty) FROM tblsale WHERE RemainID = r.AID AND BranchID = ?), 0) -
          COALESCE((SELECT SUM(ReturnQty) FROM tblsale_return WHERE RemainID = r.AID AND BranchID = ?), 0)
        ) -
        COALESCE((SELECT SUM(Qty) FROM tbldamage WHERE ProductID = r.AID AND BranchID = ?), 0) +
        COALESCE((SELECT SUM(Qty) FROM tblstock_adjustment WHERE ProductID = r.AID AND BranchID = ?), 0)
      )`;
      qtyParams = [branchId, branchId, branchId, branchId, branchId, branchId];
    }

    let stockSelect = qtySelect;
    if (isService === '1') {
      stockSelect = '999999';
    }

    let whereClause = '';
    let params = [];
    
    if (isService === '1') {
      whereClause = 'r.IsService = 1';
    } else if (isSparePart === '1') {
      whereClause = `${qtySelect} > 0 AND r.IsSparePart = 1 AND r.IsService = 0`;
      params = [...qtyParams];
    } else {
      whereClause = `${qtySelect} > 0 AND r.IsService = 0 AND r.IsSparePart = 0`;
      params = [...qtyParams];
    }
    
    if (categoryId) {
      whereClause += ' AND r.CategoryID = ?';
      params.push(categoryId);
    }

    if (isSerialized !== undefined && isSerialized !== '' && isService !== '1' && isSparePart !== '1') {
      whereClause += ' AND r.IsSerialized = ?';
      params.push(isSerialized);
    }
    
    if (search) {
      whereClause += ' AND (r.Name LIKE ? OR r.CodeNo LIKE ? OR EXISTS (SELECT 1 FROM tblpurchase_items pi WHERE pi.product_id = r.AID AND (pi.imei_1 = ? OR pi.imei_2 = ?) AND pi.BranchID = ?))';
      params.push(`%${search}%`, `%${search}%`, search, search, branchId);
    }
    
    // Get total count
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM tblproduct r WHERE ${whereClause}`,
      params
    );
    const total = countResult[0].total;
    
    // Get paginated data with category name
    const [rows] = await pool.query(
      `SELECT 
        r.AID as id,
        r.CodeNo as code,
        r.Name as name,
        r.SellingPrice as price,
        ${stockSelect} as stock,
        r.CategoryID as categoryId,
        c.Category as categoryName,
        r.IsSerialized as isSerialized,
        r.Img as image,
        r.IsService as isService
       FROM tblproduct r
       LEFT JOIN tblcategory c ON r.CategoryID = c.AID
       WHERE ${whereClause}
       ORDER BY r.Name
       LIMIT ? OFFSET ?`,
      isService === '1' ? [...params, limit, offset] : [...qtyParams, ...params, limit, offset]
    );
    
    // Format data
    const formattedRows = rows.map(row => ({
      ...row,
      imageUrl: row.image || null,
      isService: !!row.isService
    }));
    
    const result = {
      data: formattedRows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };
    
    // Cache for 2 minutes (items change more frequently)
    await cache.set(cacheKey, result, 120);
    
    res.json({
      success: true,
      ...result,
      fromCache: false
    });
  } catch (error) {
    console.error('getItems error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch items'
    });
  }
};

// Get single item by ID or code
const getItemByCode = async (req, res) => {
  try {
    const { code } = req.params;
    
    const { userType, branchId } = req.user;
    let qtySelect = 'r.StockQty';
    let qtyParams = [];
    
    if (userType !== 'admin' && branchId) {
      qtySelect = `(
        COALESCE((SELECT SUM(quantity) FROM tblpurchase_items WHERE product_id = r.AID AND BranchID = ? AND purchase_id IS NOT NULL AND Status != 4), 0) - 
        COALESCE((SELECT SUM(pr.ReturnQty) FROM tblpurchase_return pr JOIN tblpurchase_items pi ON pr.PurchaseID = pi.p_item_id WHERE pi.product_id = r.AID AND pi.BranchID = ?), 0) -
        (
          COALESCE((SELECT SUM(Qty) FROM tblsale WHERE RemainID = r.AID AND BranchID = ?), 0) -
          COALESCE((SELECT SUM(ReturnQty) FROM tblsale_return WHERE RemainID = r.AID AND BranchID = ?), 0)
        ) -
        COALESCE((SELECT SUM(Qty) FROM tbldamage WHERE ProductID = r.AID AND BranchID = ?), 0) +
        COALESCE((SELECT SUM(Qty) FROM tblstock_adjustment WHERE ProductID = r.AID AND BranchID = ?), 0)
      )`;
      qtyParams = [branchId, branchId, branchId, branchId, branchId, branchId];
    }

    const [rows] = await pool.query(
      `SELECT 
        r.AID as id,
        r.CodeNo as code,
        r.Name as name,
        r.SellingPrice as price,
        ${qtySelect} as stock,
        r.CategoryID as categoryId,
        c.Category as categoryName,
        r.Img as image
       FROM tblproduct r
       LEFT JOIN tblcategory c ON r.CategoryID = c.AID
       WHERE r.CodeNo = ?`,
      [...qtyParams, code]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Item not found or out of stock'
      });
    }
    
    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('getItemByCode error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch item'
    });
  }
};

// Search items (for barcode/quick search)
const searchItems = async (req, res) => {
  try {
    const { q } = req.query;
    const limit = parseInt(req.query.limit) || 10;
    
    if (!q || q.length < 1) {
      return res.json({
        success: true,
        data: []
      });
    }
    
    const { userType, branchId } = req.user;
    let qtySelect = 'r.StockQty';
    let qtyParams = [];
    
    if (userType !== 'admin' && branchId) {
      qtySelect = `(
        COALESCE((SELECT SUM(quantity) FROM tblpurchase_items WHERE product_id = r.AID AND BranchID = ? AND purchase_id IS NOT NULL AND Status != 4), 0) - 
        COALESCE((SELECT SUM(pr.ReturnQty) FROM tblpurchase_return pr JOIN tblpurchase_items pi ON pr.PurchaseID = pi.p_item_id WHERE pi.product_id = r.AID AND pi.BranchID = ?), 0) -
        (
          COALESCE((SELECT SUM(Qty) FROM tblsale WHERE RemainID = r.AID AND BranchID = ?), 0) -
          COALESCE((SELECT SUM(ReturnQty) FROM tblsale_return WHERE RemainID = r.AID AND BranchID = ?), 0)
        ) -
        COALESCE((SELECT SUM(Qty) FROM tbldamage WHERE ProductID = r.AID AND BranchID = ?), 0) +
        COALESCE((SELECT SUM(Qty) FROM tblstock_adjustment WHERE ProductID = r.AID AND BranchID = ?), 0)
      )`;
      qtyParams = [branchId, branchId, branchId, branchId, branchId, branchId];
    }

    const [rows] = await pool.query(
      `SELECT 
        r.AID as id,
        r.CodeNo as code,
        r.Name as name,
        r.SellingPrice as price,
        ${qtySelect} as stock,
        r.CategoryID as categoryId,
        c.Category as categoryName,
        r.Img as image
       FROM tblproduct r
       LEFT JOIN tblcategory c ON r.CategoryID = c.AID
       WHERE ${qtySelect} > 0 AND (r.CodeNo LIKE ? OR r.Name LIKE ?)
       ORDER BY 
         CASE WHEN r.CodeNo = ? THEN 0 ELSE 1 END,
         r.Name
       LIMIT ?`,
      [...qtyParams, ...qtyParams, `%${q}%`, `%${q}%`, q, limit]
    );
    
    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('searchItems error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search items'
    });
  }
};

const getAvailableImeis = async (req, res) => {
  try {
    const { productId } = req.params;
    
    const { userType, branchId } = req.user;
    let query = `SELECT 
        pi.p_item_id as id, 
        pi.imei_1, 
        pi.imei_2, 
        pi.sell_price,
        pi.specification,
        'Available' as status 
       FROM tblpurchase_items pi
       WHERE pi.product_id = ? 
       AND pi.imei_1 IS NOT NULL 
       AND pi.imei_1 != ''
       AND (pi.status = 0 OR pi.status IS NULL)`;
    let params = [productId];

    if (userType !== 'admin' && branchId) {
      query += ' AND pi.BranchID = ?';
      params.push(branchId);
    }

    const [rows] = await pool.query(query, params);
    
    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Get available IMEIs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available IMEIs'
    });
  }
};

module.exports = {
  getCategories,
  getItems,
  getItemByCode,
  searchItems,
  getAvailableImeis
};

