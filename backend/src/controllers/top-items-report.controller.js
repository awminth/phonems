const pool = require('../config/database').pool;
const { cache } = require('../config/redis');

// Cache key prefix
const CACHE_PREFIX = 'top_items_report';

// Get top selling items (grouped by RemainID)
const getTopItems = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const fromDate = req.query.fromDate || '';
    const toDate = req.query.toDate || '';
    const categoryId = req.query.categoryId || '';
    const supplierId = req.query.supplierId || '';
    const sortBy = req.query.sortBy || 'qty'; // qty or total

    const offset = (page - 1) * limit;

    const { userType, branchId } = req.user;

    // Build where clause for tblsale
    let whereClause = '1=1';
    let params = [];

    if (userType !== 'admin' && branchId) {
      whereClause += ' AND s.BranchID = ?';
      params.push(branchId);
    }

    if (search) {
      whereClause += ' AND (s.ItemName LIKE ? OR s.CodeNo LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (fromDate) {
      whereClause += ' AND DATE(s.Date) >= ?';
      params.push(fromDate);
    }

    if (toDate) {
      whereClause += ' AND DATE(s.Date) <= ?';
      params.push(toDate);
    }

    if (categoryId) {
      whereClause += ' AND r.CategoryID = ?';
      params.push(categoryId);
    }

    if (supplierId) {
      whereClause += ' AND r.SupplierID = ?';
      params.push(supplierId);
    }

    // Generate cache key
    const cacheKey = `${CACHE_PREFIX}:list:${page}:${limit}:${search}:${fromDate}:${toDate}:${categoryId}:${supplierId}:${sortBy}:${branchId || 'all'}`;

    // Try cache
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        ...cachedData,
        fromCache: true
      });
    }

    // Determine sort order
    const orderBy = sortBy === 'total' ? 'totalAmount DESC' : 'totalQty DESC';

    // Get total count of unique RemainIDs / Service Items
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM (
        SELECT s.RemainID
        FROM tblsale s
        LEFT JOIN tblproduct r ON s.RemainID = r.AID
        WHERE ${whereClause}
        GROUP BY s.RemainID, s.CodeNo, s.ItemName
      ) t`,
      params
    );
    const total = countResult[0].total;

    // Get paginated grouped data
    const [rows] = await pool.query(
      `SELECT 
        IFNULL(s.RemainID, CONCAT('SRV|', IFNULL(s.CodeNo,''), '|', IFNULL(s.ItemName,''))) as id,
        s.CodeNo as code,
        s.ItemName as name,
        SUM(s.Qty) as totalQty,
        SUM(s.Qty * s.SellPrice) as totalAmount,
        r.CategoryID as categoryId,
        c.Category as categoryName,
        r.SupplierID as supplierId,
        sp.Supplier as supplierName,
        r.Img as image,
        MAX(s.Date) as lastSaleDate
       FROM tblsale s
       LEFT JOIN tblproduct r ON s.RemainID = r.AID
       LEFT JOIN tblcategory c ON r.CategoryID = c.AID
       LEFT JOIN tblsupplier sp ON r.SupplierID = sp.AID
       WHERE ${whereClause}
       GROUP BY s.RemainID, s.CodeNo, s.ItemName, r.CategoryID, c.Category, r.SupplierID, sp.Supplier, r.Img
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    // Calculate grand totals
    const [totalsResult] = await pool.query(
      `SELECT 
        COALESCE(SUM(s.Qty), 0) as grandTotalQty,
        COALESCE(SUM(s.Qty * s.SellPrice), 0) as grandTotalAmount
       FROM tblsale s
       LEFT JOIN tblproduct r ON s.RemainID = r.AID
       WHERE ${whereClause}`,
      params
    );

    const result = {
      data: rows,
      totals: totalsResult[0],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };

    // Cache for 2 minutes
    await cache.set(cacheKey, result, 120);

    res.json({
      success: true,
      ...result,
      fromCache: false
    });
  } catch (error) {
    console.error('getTopItems error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch top items report'
    });
  }
};

// Get dropdowns for filters (categories, suppliers)
const getDropdowns = async (req, res) => {
  try {
    const cacheKey = `${CACHE_PREFIX}:dropdowns`;

    // Try cache
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        data: cachedData,
        fromCache: true
      });
    }

    // Get categories
    const [categories] = await pool.query(
      `SELECT AID as id, Category as name FROM tblcategory ORDER BY Category`
    );

    // Get suppliers
    const [suppliers] = await pool.query(
      `SELECT AID as id, Supplier as name FROM tblsupplier ORDER BY Supplier`
    );

    const result = {
      categories,
      suppliers
    };

    // Cache for 5 minutes
    await cache.set(cacheKey, result, 300);

    res.json({
      success: true,
      data: result,
      fromCache: false
    });
  } catch (error) {
    console.error('getDropdowns error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dropdowns'
    });
  }
};

// Get item detail (sale history for a specific RemainID or Service)
const getItemDetail = async (req, res) => {
  try {
    const { remainId } = req.params;
    const fromDate = req.query.fromDate || '';
    const toDate = req.query.toDate || '';
    const { userType, branchId } = req.user;

    let whereClause = '';
    let params = [];
    let isService = false;
    let srvCode = '';
    let srvName = '';

    if (remainId && remainId.startsWith('SRV|')) {
      isService = true;
      const parts = remainId.split('|');
      srvCode = parts[1] || '';
      srvName = parts[2] || '';
      
      whereClause = 's.RemainID IS NULL AND IFNULL(s.CodeNo,"") = ? AND IFNULL(s.ItemName,"") = ?';
      params = [srvCode, srvName];
    } else {
      whereClause = 's.RemainID = ?';
      params = [remainId];
    }

    if (userType !== 'admin' && branchId) {
      whereClause += ' AND s.BranchID = ?';
      params.push(branchId);
    }

    const dateWhere = [];
    const dateParams = [];
    if (fromDate) {
      dateWhere.push('DATE(s.Date) >= ?');
      dateParams.push(fromDate);
    }
    if (toDate) {
      dateWhere.push('DATE(s.Date) <= ?');
      dateParams.push(toDate);
    }

    const fullWhere = whereClause + (dateWhere.length ? ' AND ' + dateWhere.join(' AND ') : '');
    const fullParams = [...params, ...dateParams];

    const cacheKey = `${CACHE_PREFIX}:detail:${remainId}:${fromDate}:${toDate}:${branchId || 'all'}`;

    // Try cache
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        data: cachedData,
        fromCache: true
      });
    }

    let item;

    if (isService) {
      // For service items, construct info from the latest sale or dummy
      const [srvInfo] = await pool.query(
        `SELECT 
          CodeNo as code,
          ItemName as name,
          0 as remainQty,
          SellPrice as sellPrice,
          NULL as categoryName,
          NULL as supplierName,
          NULL as image
         FROM tblsale s
         WHERE ${whereClause}
         ORDER BY Date DESC
         LIMIT 1`,
        params
      );
      
      if (srvInfo.length === 0) {
        return res.status(404).json({ success: false, message: 'Service item not found' });
      }
      item = { ...srvInfo[0], id: remainId };
    } else {
      // Get regular product info
      const [itemInfo] = await pool.query(
        `SELECT 
          r.AID as id,
          r.CodeNo as code,
          r.Name as name,
          r.StockQty as remainQty,
          r.SellingPrice as sellPrice,
          r.CategoryID as categoryId,
          c.Category as categoryName,
          r.SupplierID as supplierId,
          sp.Supplier as supplierName,
          r.Img as image
         FROM tblproduct r
         LEFT JOIN tblcategory c ON r.CategoryID = c.AID
         LEFT JOIN tblsupplier sp ON r.SupplierID = sp.AID
         WHERE r.AID = ?`,
        [remainId]
      );

      if (itemInfo.length === 0) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }
      item = itemInfo[0];
    }

    // Get sale history
    const [saleHistory] = await pool.query(
      `SELECT 
        s.AID as id,
        s.VNO as vno,
        s.Qty as qty,
        s.SellPrice as sellPrice,
        (s.Qty * s.SellPrice) as amount,
        s.Date as date,
        s.CustomerID as customerId,
        cu.Name as customerName
       FROM tblsale s
       LEFT JOIN tblcustomer cu ON s.CustomerID = cu.AID
       WHERE ${fullWhere}
       ORDER BY s.Date DESC, s.AID DESC`,
      fullParams
    );

    // Calculate totals
    const [totals] = await pool.query(
      `SELECT 
        COALESCE(SUM(s.Qty), 0) as totalQty,
        COALESCE(SUM(s.Qty * s.SellPrice), 0) as totalAmount
       FROM tblsale s
       WHERE ${fullWhere}`,
      fullParams
    );

    const result = {
      item,
      saleHistory,
      totals: totals[0]
    };

    // Cache for 2 minutes
    await cache.set(cacheKey, result, 120);

    res.json({
      success: true,
      data: result,
      fromCache: false
    });
  } catch (error) {
    console.error('getItemDetail error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch item detail'
    });
  }
};

module.exports = {
  getTopItems,
  getDropdowns,
  getItemDetail
};

