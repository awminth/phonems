const { pool } = require('../config/database');

// Table: tblsupplier
// Columns: AID (Primary Key), Supplier (Name), Address, Email, PhoneNo

const supplierModel = {
  // Find all suppliers with pagination
  async findAll({ page = 1, limit = 10, search = '' }) {
    const offset = (page - 1) * limit;
    
    let query = 'SELECT * FROM tblsupplier';
    let countQuery = 'SELECT COUNT(*) as total FROM tblsupplier';
    const params = [];
    const countParams = [];
    
    // Add search condition
    if (search) {
      query += ' WHERE Supplier LIKE ? OR Address LIKE ? OR Email LIKE ? OR PhoneNo LIKE ?';
      countQuery += ' WHERE Supplier LIKE ? OR Address LIKE ? OR Email LIKE ? OR PhoneNo LIKE ?';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
      countParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }
    
    // Add pagination
    query += ' ORDER BY AID DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const [rows] = await pool.query(query, params);
    const [countResult] = await pool.query(countQuery, countParams);
    
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);
    
    return {
      data: rows.map(row => ({
        id: row.AID.toString(),
        name: row.Supplier,
        address: row.Address || '',
        email: row.Email || '',
        phone: row.PhoneNo || ''
      })),
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

  // Find supplier by ID
  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM tblsupplier WHERE AID = ?', [id]);
    
    if (rows.length === 0) {
      return null;
    }
    
    const row = rows[0];
    return {
      id: row.AID.toString(),
      name: row.Supplier,
      address: row.Address || '',
      email: row.Email || '',
      phone: row.PhoneNo || ''
    };
  },

  // Create new supplier
  async create({ name, address, email, phone }) {
    const [result] = await pool.query(
      'INSERT INTO tblsupplier (Supplier, Address, Email, PhoneNo) VALUES (?, ?, ?, ?)',
      [name, address || '', email || '', phone || '']
    );
    
    return {
      id: result.insertId.toString(),
      name,
      address: address || '',
      email: email || '',
      phone: phone || ''
    };
  },

  // Update supplier
  async update(id, { name, address, email, phone }) {
    const [result] = await pool.query(
      'UPDATE tblsupplier SET Supplier = ?, Address = ?, Email = ?, PhoneNo = ? WHERE AID = ?',
      [name, address || '', email || '', phone || '', id]
    );
    
    if (result.affectedRows === 0) {
      return null;
    }
    
    return this.findById(id);
  },

  // Delete supplier
  async delete(id) {
    const [result] = await pool.query('DELETE FROM tblsupplier WHERE AID = ?', [id]);
    return result.affectedRows > 0;
  },

  // Get supplier transaction summary (total paid and total purchases)
  async getTransactionSummary(supplierId) {
    // Get total paid from tblsupplierpay
    const [paidResult] = await pool.query(
      'SELECT COALESCE(SUM(Amt), 0) as totalPaid FROM tblsupplierpay WHERE SupplierID = ?',
      [supplierId]
    );
    
    // Get total purchases from tblpurchases (New Schema)
    const [purchaseResult] = await pool.query(
      'SELECT COALESCE(SUM(net_amount), 0) as totalPurchases FROM tblpurchases WHERE supplier_id = ?',
      [supplierId]
    );
    
    const totalPaid = parseFloat(paidResult[0].totalPaid) || 0;
    const totalPurchases = parseFloat(purchaseResult[0].totalPurchases) || 0;
    const outstanding = totalPurchases - totalPaid;
    
    return {
      totalPaid,
      totalPurchases,
      outstanding
    };
  },

  // Get supplier payments with pagination and search (from tblsupplierpay)
  async getPayments({ supplierId, page = 1, limit = 10, fromDate = '', toDate = '' }) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT sp.*, u.Username as UserName 
      FROM tblsupplierpay sp
      LEFT JOIN tbluser u ON sp.UserID = u.AID
      WHERE sp.SupplierID = ?
    `;
    let countQuery = 'SELECT COUNT(*) as total FROM tblsupplierpay WHERE SupplierID = ?';
    const params = [supplierId];
    const countParams = [supplierId];
    const vno = arguments[0].vno || '';
    
    // Add VNO filter
    if (vno) {
      query += ' AND sp.VNO = ?';
      countQuery += ' AND VNO = ?';
      params.push(vno);
      countParams.push(vno);
    }
    
    // Add date filter
    if (fromDate) {
      query += ' AND sp.Date >= ?';
      countQuery += ' AND Date >= ?';
      params.push(fromDate);
      countParams.push(fromDate);
    }
    if (toDate) {
      query += ' AND sp.Date <= ?';
      countQuery += ' AND Date <= ?';
      params.push(toDate);
      countParams.push(toDate);
    }
    
    query += ' ORDER BY sp.Date DESC, sp.AID DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const [rows] = await pool.query(query, params);
    const [countResult] = await pool.query(countQuery, countParams);
    
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);
    
    return {
      data: rows.map(row => ({
        id: row.AID.toString(),
        supplierId: row.SupplierID.toString(),
        amount: parseFloat(row.Amt) || 0,
        date: row.Date ? new Date(row.Date).toISOString().split('T')[0] : '',
        userId: row.UserID?.toString() || '',
        userName: row.UserName || 'Unknown',
        vno: row.VNO || '',
        remark: row.Rmk || ''
      })),
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

  // Create supplier payment
  async createPayment({ supplierId, amount, date, userId, vno, remark }) {
    const [result] = await pool.query(
      'INSERT INTO tblsupplierpay (SupplierID, Amt, Date, UserID, VNO, Rmk) VALUES (?, ?, ?, ?, ?, ?)',
      [supplierId, amount, date, userId || null, vno || null, remark || '']
    );
    
    return {
      id: result.insertId.toString(),
      supplierId: supplierId.toString(),
      amount: parseFloat(amount) || 0,
      date: date,
      userId: userId?.toString() || '',
      userName: 'Unknown',
      vno: vno || '',
      remark: remark || ''
    };
  },

  // Update supplier payment
  async updatePayment(id, { amount, date, userId, vno, remark }) {
    const [result] = await pool.query(
      'UPDATE tblsupplierpay SET Amt = ?, Date = ?, UserID = ?, VNO = ?, Rmk = ? WHERE AID = ?',
      [amount, date, userId || null, vno || null, remark || '', id]
    );
    
    if (result.affectedRows === 0) {
      return null;
    }
    
    // Get updated payment with user name
    const [rows] = await pool.query(
      `SELECT sp.*, u.Username as UserName 
       FROM tblsupplierpay sp
       LEFT JOIN tbluser u ON sp.UserID = u.AID
       WHERE sp.AID = ?`,
      [id]
    );
    
    if (rows.length === 0) {
      return null;
    }
    
    const row = rows[0];
    return {
      id: row.AID.toString(),
      supplierId: row.SupplierID.toString(),
      amount: parseFloat(row.Amt) || 0,
      date: row.Date ? new Date(row.Date).toISOString().split('T')[0] : '',
      userId: row.UserID?.toString() || '',
      userName: row.UserName || 'Unknown',
      vno: row.VNO || '',
      remark: row.Rmk || ''
    };
  },

  // Delete supplier payment
  async deletePayment(id) {
    const [result] = await pool.query('DELETE FROM tblsupplierpay WHERE AID = ?', [id]);
    return result.affectedRows > 0;
  },

  // Get supplier purchases with pagination and search (from tblpurchases and tblpurchase_items)
  async getPurchases({ supplierId, page = 1, limit = 10, fromDate = '', toDate = '' }) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT 
        pi.p_item_id as id,
        p.supplier_id as SupplierID,
        pi.purchase_id as PurchaseID,
        pi.sub_total as Amt,
        p.purchase_date as Date,
        prod.CodeNo,
        prod.Name as ItemName,
        pi.quantity as Qty,
        pi.cost_price as PurchasePrice,
        p.purchase_date as PurchaseDate
      FROM tblpurchase_items pi
      JOIN tblpurchases p ON pi.purchase_id = p.purchase_id
      JOIN tblproduct prod ON pi.product_id = prod.AID
      WHERE p.supplier_id = ?
    `;
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM tblpurchase_items pi
      JOIN tblpurchases p ON pi.purchase_id = p.purchase_id
      WHERE p.supplier_id = ?
    `;
    const params = [supplierId];
    const countParams = [supplierId];
    
    // Add date filter
    if (fromDate) {
      query += ' AND p.purchase_date >= ?';
      countQuery += ' AND p.purchase_date >= ?';
      params.push(fromDate);
      countParams.push(fromDate);
    }
    if (toDate) {
      query += ' AND p.purchase_date <= ?';
      countQuery += ' AND p.purchase_date <= ?';
      params.push(toDate);
      countParams.push(toDate);
    }
    
    query += ' ORDER BY p.purchase_date DESC, pi.p_item_id DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const [rows] = await pool.query(query, params);
    const [countResult] = await pool.query(countQuery, countParams);
    
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);
    
    return {
      data: rows.map(row => ({
        id: row.id.toString(),
        supplierId: row.SupplierID.toString(),
        purchaseId: row.PurchaseID.toString(),
        amount: parseFloat(row.Amt) || 0,
        date: row.Date ? new Date(row.Date).toISOString().split('T')[0] : '',
        codeNo: row.CodeNo || '',
        itemName: row.ItemName || '',
        qty: row.Qty || 0,
        purchasePrice: parseFloat(row.PurchasePrice) || 0,
        purchaseDate: row.PurchaseDate ? new Date(row.PurchaseDate).toISOString().split('T')[0] : ''
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }
};

module.exports = supplierModel;

