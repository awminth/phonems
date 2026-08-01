const pool = require('../config/database').pool;

const inventoryModel = {
  // Find all inventory items with pagination and filters
  async findAll({ page = 1, limit = 10, search = '', categoryId = '', supplierId = '', underQty = '', userType, branchId, isSerialized = '', isService = '', isSparePart = '' }) {
    const offset = (page - 1) * limit;
    
    let whereConditions = ['1=1'];
    let params = [];
    
    // Search by CodeNo, Name, or IMEI
    if (search) {
      whereConditions.push('(r.CodeNo LIKE ? OR r.Name LIKE ? OR EXISTS (SELECT 1 FROM tblpurchase_items pi WHERE pi.product_id = r.AID AND (pi.imei_1 LIKE ? OR pi.imei_2 LIKE ?)))');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    // Filter by CategoryID
    if (categoryId) {
      whereConditions.push('r.CategoryID = ?');
      params.push(categoryId);
    }
    
    // Filter by SupplierID
    if (supplierId) {
      whereConditions.push('r.SupplierID = ?');
      params.push(supplierId);
    }

    // Filter by IsSerialized
    if (isSerialized !== undefined && isSerialized !== null && isSerialized !== '') {
      whereConditions.push('r.IsSerialized = ?');
      params.push(parseInt(isSerialized));
    }
    
    // Filter by IsService
    if (isService !== undefined && isService !== null && isService !== '') {
      whereConditions.push('r.IsService = ?');
      params.push(parseInt(isService));
    }

    // Filter by IsSparePart
    if (isSparePart !== undefined && isSparePart !== null && isSparePart !== '') {
      if (parseInt(isSparePart) === 1) {
        whereConditions.push('r.IsSparePart = 1');
      } else {
        whereConditions.push('(r.IsSparePart = 0 OR r.IsSparePart IS NULL)');
      }
    }

    // Branch specific stock subquery
    let qtySelect = 'r.StockQty';
    let qtyParams = [];

    if (branchId) {
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
      
      // Filter by under qty using branch stock
      if (underQty === 'min') {
        whereConditions.push(`${qtySelect} <= r.MinStockQty`);
        params.push(branchId, branchId, branchId, branchId, branchId, branchId);
      } else if (underQty && !isNaN(parseInt(underQty))) {
        whereConditions.push(`${qtySelect} <= ?`);
        params.push(branchId, branchId, branchId, branchId, branchId, branchId, parseInt(underQty));
      }
    } else {
      // Filter by under qty (low stock alert) - global
      if (underQty === 'min') {
        whereConditions.push('r.StockQty <= r.MinStockQty');
      } else if (underQty && !isNaN(parseInt(underQty))) {
        whereConditions.push('r.StockQty <= ?');
        params.push(parseInt(underQty));
      }
    }
    
    const whereClause = whereConditions.join(' AND ');
    
    // Get total count
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM tblproduct r WHERE ${whereClause}`,
      params
    );
    const total = countResult[0].total;
    
    // Get paginated data with JOIN for category and supplier names
    const [rows] = await pool.query(
      `SELECT 
        r.AID as id,
        r.CodeNo as code,
        r.Name as name,
        ${qtySelect} as qty,
        r.SellingPrice as sellPrice,
        r.MinStockQty as minStockQty,
        r.CategoryID as categoryId,
        r.SupplierID as supplierId,
        r.IsSerialized as isSerialized,
        r.IsService as isService,
        r.IsSparePart as isSparePart,
        r.Img as image,
        NULL as date,
        COALESCE(c.Category, '') as categoryName,
        COALESCE(s.Supplier, '') as supplierName
      FROM tblproduct r
      LEFT JOIN tblcategory c ON r.CategoryID = c.AID
      LEFT JOIN tblsupplier s ON r.SupplierID = s.AID
      WHERE ${whereClause}
      ORDER BY r.AID DESC
      LIMIT ? OFFSET ?`,
      [...qtyParams, ...params, limit, offset]
    );
    
    return {
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };
  },

  // Find by ID
  async findById(id, { userType, branchId } = {}) {
    // Branch specific stock subquery
    let qtySelect = 'r.StockQty';
    let qtyParams = [];

    if (branchId) {
      qtySelect = `(
        COALESCE((SELECT SUM(quantity) FROM tblpurchase_items WHERE product_id = r.AID AND BranchID = ? AND purchase_id IS NOT NULL AND Status != 4), 0) - 
        (
          COALESCE((SELECT SUM(Qty) FROM tblsale WHERE RemainID = r.AID AND BranchID = ?), 0) -
          COALESCE((SELECT SUM(ReturnQty) FROM tblsale_return WHERE RemainID = r.AID AND BranchID = ?), 0)
        ) -
        COALESCE((SELECT SUM(Qty) FROM tbldamage WHERE ProductID = r.AID AND BranchID = ?), 0) +
        COALESCE((SELECT SUM(Qty) FROM tblstock_adjustment WHERE ProductID = r.AID AND BranchID = ?), 0)
      )`;
      qtyParams = [branchId, branchId, branchId, branchId, branchId];
    }

    const [rows] = await pool.query(
      `SELECT 
        r.AID as id,
        r.CodeNo as code,
        r.Name as name,
        ${qtySelect} as qty,
        r.SellingPrice as sellPrice,
        r.MinStockQty as minStockQty,
        r.CategoryID as categoryId,
        r.SupplierID as supplierId,
        r.IsSerialized as isSerialized,
        r.IsService as isService,
        r.IsSparePart as isSparePart,
        r.Img as image,
        NULL as date,
        COALESCE(c.Category, '') as categoryName,
        COALESCE(s.Supplier, '') as supplierName
      FROM tblproduct r
      LEFT JOIN tblcategory c ON r.CategoryID = c.AID
      LEFT JOIN tblsupplier s ON r.SupplierID = s.AID
      WHERE r.AID = ?`,
      [...qtyParams, id]
    );
    return rows[0] || null;
  },

  // Update inventory item (only StockQty and SellingPrice)
  async update(id, { qty, sellPrice, userId, branchId }) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Get current price
      const [current] = await connection.query(
        'SELECT SellingPrice FROM tblproduct WHERE AID = ?',
        [id]
      );
      
      const oldPrice = current[0]?.SellingPrice || 0;

      // 2. Update product
      const [result] = await connection.query(
        'UPDATE tblproduct SET StockQty = ?, SellingPrice = ? WHERE AID = ?',
        [qty, sellPrice, id]
      );
      
      if (result.affectedRows === 0) {
        await connection.rollback();
        return null;
      }

      // 3. Record price history if price changed
      if (oldPrice !== sellPrice) {
        await connection.query(
          'INSERT INTO tblselling_price_history (ProductID, OldPrice, NewPrice, UserID, BranchID) VALUES (?, ?, ?, ?, ?)',
          [id, oldPrice, sellPrice, userId, branchId]
        );
      }

      await connection.commit();
      return this.findById(id, { branchId });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // Get categories for dropdown
  async getCategories() {
    const [rows] = await pool.query(
      'SELECT AID as id, Category as name FROM tblcategory ORDER BY Category'
    );
    return rows;
  },

  // Get suppliers for dropdown
  async getSuppliers() {
    const [rows] = await pool.query(
      'SELECT AID as id, Supplier as name FROM tblsupplier ORDER BY Supplier'
    );
    return rows;
  },

  // Get low stock items count
  async getLowStockCount(threshold = 5, { userType, branchId } = {}) {
    let query;
    let params = [];

    if (threshold === 'min') {
      query = 'SELECT COUNT(*) as count FROM tblproduct WHERE StockQty <= MinStockQty';
    } else {
      query = 'SELECT COUNT(*) as count FROM tblproduct WHERE StockQty <= ?';
      params.push(threshold);
    }

    if (branchId) {
      const qtySubquery = `(
        COALESCE((SELECT SUM(quantity) FROM tblpurchase_items WHERE product_id = AID AND BranchID = ? AND purchase_id IS NOT NULL AND Status != 4), 0) - 
        (
          COALESCE((SELECT SUM(Qty) FROM tblsale WHERE RemainID = AID AND BranchID = ?), 0) -
          COALESCE((SELECT SUM(ReturnQty) FROM tblsale_return WHERE RemainID = AID AND BranchID = ?), 0)
        ) -
        COALESCE((SELECT SUM(Qty) FROM tbldamage WHERE ProductID = AID AND BranchID = ?), 0) +
        COALESCE((SELECT SUM(Qty) FROM tblstock_adjustment WHERE ProductID = AID AND BranchID = ?), 0)
      )`;
      if (threshold === 'min') {
        query = `SELECT COUNT(*) as count FROM tblproduct WHERE ${qtySubquery} <= MinStockQty`;
        params = [branchId, branchId, branchId, branchId, branchId];
      } else {
        query = `SELECT COUNT(*) as count FROM tblproduct WHERE ${qtySubquery} <= ?`;
        params = [branchId, branchId, branchId, branchId, branchId, threshold];
      }
    }

    const [result] = await pool.query(query, params);
    return result[0].count;
  },

  // Get IMEIs by Product ID
  async getImeisByProductId(productId, { userType, branchId } = {}) {
    let query = `SELECT 
        pi.p_item_id as stock_id, 
        pi.imei_1, 
        pi.imei_2, 
        CASE 
          WHEN pi.Status = 1 THEN 'Sold' 
          WHEN pi.Status = 2 THEN 'Returned' 
          WHEN pi.Status = 3 THEN 'Damaged'
          WHEN pi.Status = 4 THEN 'In-Transit'
          ELSE 'Available' 
        END as status 
       FROM tblpurchase_items pi
       WHERE pi.product_id = ? 
       AND pi.imei_1 IS NOT NULL 
       AND pi.imei_1 != ''`;
    let params = [productId];

    if (branchId) {
      query += ' AND pi.BranchID = ?';
      params.push(branchId);
    }

    const [rows] = await pool.query(query, params);
    return rows;
  },

  // Get Purchase Price History
  async getPurchasePriceHistory(productId, { userType, branchId } = {}) {
    let query = `SELECT 
        pi.cost_price as price,
        p.purchase_date as date,
        p.invoice_no as invoice,
        s.Supplier as supplierName,
        pi.quantity as qty,
        pi.imei_1,
        pi.imei_2
       FROM tblpurchase_items pi
       JOIN tblpurchases p ON pi.purchase_id = p.purchase_id
       LEFT JOIN tblsupplier s ON p.supplier_id = s.AID
       WHERE pi.product_id = ?`;
    let params = [productId];

    if (branchId) {
      query += ' AND pi.BranchID = ?';
      params.push(branchId);
    }

    query += ' ORDER BY p.purchase_date DESC';

    const [rows] = await pool.query(query, params);
    return rows;
  },

  // Get Selling Price History by Product ID
  async getSellingPriceHistory(productId) {
    const [rows] = await pool.query(
      `SELECT 
        h.OldPrice as oldPrice,
        h.NewPrice as newPrice,
        h.UpdateDate as date,
        u.UserName as userName
       FROM tblselling_price_history h
       LEFT JOIN tbluser u ON h.UserID = u.AID
       WHERE h.ProductID = ?
       ORDER BY h.UpdateDate DESC`,
      [productId]
    );
    return rows;
  },

  // Get All Selling Price History
  async getAllSellingPriceHistory({ page = 1, limit = 10, fromDate, toDate, branchId, search }) {
    const offset = (page - 1) * limit;
    let whereClause = '1=1';
    const params = [];

    if (fromDate) {
      whereClause += ' AND DATE(h.UpdateDate) >= ?';
      params.push(fromDate);
    }
    if (toDate) {
      whereClause += ' AND DATE(h.UpdateDate) <= ?';
      params.push(toDate);
    }
    if (branchId && branchId !== 'all') {
      whereClause += ' AND h.BranchID = ?';
      params.push(branchId);
    }
    if (search) {
      whereClause += ' AND (p.Name LIKE ? OR p.CodeNo LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const query = `
      SELECT 
        h.AID as id,
        h.OldPrice as oldPrice,
        h.NewPrice as newPrice,
        h.UpdateDate as date,
        u.UserName as userName,
        p.Name as productName,
        p.CodeNo as productCode,
        b.BranchName as branchName
      FROM tblselling_price_history h
      LEFT JOIN tbluser u ON h.UserID = u.AID
      LEFT JOIN tblproduct p ON h.ProductID = p.AID
      LEFT JOIN tblbranch b ON h.BranchID = b.AID
      WHERE ${whereClause}
      ORDER BY h.UpdateDate DESC
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM tblselling_price_history h
      LEFT JOIN tblproduct p ON h.ProductID = p.AID
      WHERE ${whereClause}
    `;

    const [rows] = await pool.query(query, [...params, limit, offset]);
    const [countResult] = await pool.query(countQuery, params);
    const total = countResult[0].total;

    return {
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
};


module.exports = inventoryModel;

