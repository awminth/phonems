const { pool } = require('../config/database');

// Table: tblpurchase (AID, CodeNo, ItemName, Qty, PurchasePrice, SellPrice, CategoryID, SupplierID, Date, Img)
// Table: tblremain - tracks total quantity per CodeNo (unique)

const purchaseModel = {
  // Find all purchases with pagination (New Schema)
  async findAll({ page = 1, limit = 10, search = '', code = '', name = '', categoryId = '', supplierId = '', date = '', fromDate = '', toDate = '', type = 'all', userType, branchId }) {
    const offset = (page - 1) * limit;
    
    let countQuery = `
      SELECT 
        COUNT(*) as total,
        SUM(pi.quantity) as totalQty,
        SUM(pi.quantity * pi.cost_price) as totalAmount
      FROM tblpurchase_items pi
      JOIN tblpurchases p ON pi.purchase_id = p.purchase_id
      JOIN tblproduct prod ON pi.product_id = prod.AID
    `;
    const params = [];
    
    let whereConditions = [];
    if (userType !== 'admin' && branchId) {
      whereConditions.push('p.BranchID = ?');
      params.push(branchId);
    }

    if (search) {
      whereConditions.push('(prod.Name LIKE ? OR prod.CodeNo LIKE ?)');
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern);
    }

    if (code) {
      whereConditions.push('prod.CodeNo LIKE ?');
      const codePattern = `%${code}%`;
      params.push(codePattern);
    }

    if (name) {
      whereConditions.push('prod.Name LIKE ?');
      const namePattern = `%${name}%`;
      params.push(namePattern);
    }

    if (categoryId) {
      whereConditions.push('prod.CategoryID = ?');
      params.push(categoryId);
    }

    if (supplierId) {
      whereConditions.push('p.supplier_id = ?');
      params.push(supplierId);
    }

    if (date) {
      whereConditions.push('DATE(p.purchase_date) = ?');
      params.push(date);
    }

    if (fromDate) {
      whereConditions.push('DATE(p.purchase_date) >= ?');
      params.push(fromDate);
    }

    if (toDate) {
      whereConditions.push('DATE(p.purchase_date) <= ?');
      params.push(toDate);
    }

    if (type === 'phone') {
      whereConditions.push('prod.IsSerialized = 1');
    } else if (type === 'accessory') {
      whereConditions.push('(prod.IsSerialized = 0 OR prod.IsSerialized IS NULL) AND prod.IsService = 0 AND (prod.IsSparePart = 0 OR prod.IsSparePart IS NULL)');
    } else if (type === 'service') {
      whereConditions.push('prod.IsService = 1');
    } else if (type === 'spare') {
      whereConditions.push('prod.IsSparePart = 1');
    }

    if (whereConditions.length > 0) {
      const whereClause = ' WHERE ' + whereConditions.join(' AND ');
      countQuery += whereClause;
    }
    
    const [rows] = await pool.query(
      `SELECT 
        pi.p_item_id as AID, 
        prod.CodeNo, 
        prod.Name as ItemName, 
        pi.quantity as Qty, 
        pi.cost_price as PurchasePrice, 
        prod.SellingPrice as SellPrice, 
        prod.CategoryID, 
        p.supplier_id as SupplierID, 
        p.purchase_date as Date, 
        prod.Img,
        pi.specification as Specification,
        c.Category as CategoryName, 
        s.Supplier as SupplierName,
        COALESCE(b.BranchName, 'Unknown') as BranchName
      FROM tblpurchase_items pi
      JOIN tblpurchases p ON pi.purchase_id = p.purchase_id
      JOIN tblproduct prod ON pi.product_id = prod.AID
      LEFT JOIN tblcategory c ON prod.CategoryID = c.AID
      LEFT JOIN tblsupplier s ON p.supplier_id = s.AID
      LEFT JOIN tblbranch b ON p.BranchID = b.AID
      ${whereConditions.length > 0 ? ' WHERE ' + whereConditions.join(' AND ') : ''}
      ORDER BY pi.p_item_id DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    const [countResult] = await pool.query(countQuery, params);
    
    const total = countResult[0].total || 0;
    const totalQty = countResult[0].totalQty || 0;
    const totalAmount = countResult[0].totalAmount || 0;
    const totalPages = Math.ceil(total / limit);
    
    return {
      data: rows.map(row => ({
        id: row.AID.toString(),
        code: row.CodeNo,
        name: row.ItemName,
        qty: row.Qty,
        purchasePrice: row.PurchasePrice,
        sellPrice: row.SellPrice,
        categoryId: row.CategoryID?.toString() || '',
        categoryName: row.CategoryName || '',
        supplierId: row.SupplierID?.toString() || '',
        supplierName: row.SupplierName || '',
        date: row.Date ? new Date(row.Date).toISOString().split('T')[0] : '',
        image: row.Img || null,
        branchName: row.BranchName,
        specification: row.Specification || ''
      })),
      totals: {
        qty: Number(totalQty),
        amount: Number(totalAmount)
      },
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  },

  // Find purchase by ID (New Schema)
  async findById(id, { userType, branchId } = {}) {
    let query = `
      SELECT 
        pi.p_item_id as AID, 
        prod.CodeNo, 
        prod.Name as ItemName, 
        pi.quantity as Qty, 
        pi.cost_price as PurchasePrice, 
        prod.SellingPrice as SellPrice, 
        prod.CategoryID, 
        p.supplier_id as SupplierID, 
        p.purchase_date as Date, 
        prod.Img,
        pi.specification as Specification,
        c.Category as CategoryName, 
        s.Supplier as SupplierName 
      FROM tblpurchase_items pi
      JOIN tblpurchases p ON pi.purchase_id = p.purchase_id
      JOIN tblproduct prod ON pi.product_id = prod.AID
      LEFT JOIN tblcategory c ON prod.CategoryID = c.AID
      LEFT JOIN tblsupplier s ON p.supplier_id = s.AID
      WHERE pi.p_item_id = ?
    `;
    let params = [id];

    if (userType !== 'admin' && branchId) {
      query += ' AND p.BranchID = ?';
      params.push(branchId);
    }

    const [rows] = await pool.query(query, params);
    
    if (rows.length === 0) {
      return null;
    }
    
    const row = rows[0];
    return {
      id: row.AID.toString(),
      code: row.CodeNo,
      name: row.ItemName,
      qty: row.Qty,
      purchasePrice: row.PurchasePrice,
      sellPrice: row.SellPrice,
      categoryId: row.CategoryID?.toString() || '',
      categoryName: row.CategoryName || '',
      supplierId: row.SupplierID?.toString() || '',
      supplierName: row.SupplierName || '',
      date: row.Date ? new Date(row.Date).toISOString().split('T')[0] : '',
      image: row.Img || null,
      specification: row.Specification || ''
    };
  },

  // Create, Update, and Delete are disabled for this legacy model.
  // Please use the purchase-voucher system instead.

  // Get all categories for dropdown
  async getCategories() {
    const [rows] = await pool.query('SELECT AID, Category FROM tblcategory ORDER BY Category');
    return rows.map(row => ({
      id: row.AID.toString(),
      name: row.Category
    }));
  },

  // Get all suppliers for dropdown
  async getSuppliers() {
    const [rows] = await pool.query('SELECT AID, Supplier FROM tblsupplier ORDER BY Supplier');
    return rows.map(row => ({
      id: row.AID.toString(),
      name: row.Supplier
    }));
  },

  // Get all master products for dropdown
  async getProducts() {
    const [rows] = await pool.query(`
      SELECT p.AID, p.CodeNo, p.Name, p.SellingPrice, p.CategoryID, p.SupplierID, p.IsSerialized, p.IsService, p.IsSparePart, c.Category as CategoryName, s.Supplier as SupplierName 
      FROM tblproduct p
      LEFT JOIN tblcategory c ON p.CategoryID = c.AID
      LEFT JOIN tblsupplier s ON p.SupplierID = s.AID
      ORDER BY p.Name
    `);
    return rows.map(row => ({
      id: row.AID.toString(),
      codeNo: row.CodeNo,
      name: row.Name,
      sellPrice: row.SellingPrice,
      categoryId: row.CategoryID?.toString() || '',
      categoryName: row.CategoryName || '',
      supplierId: row.SupplierID?.toString() || '',
      supplierName: row.SupplierName || '',
      isSerialized: Boolean(row.IsSerialized),
      isService: Boolean(row.IsService),
      isSparePart: Boolean(row.IsSparePart)
    }));
  }
};

module.exports = purchaseModel;

