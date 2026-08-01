const pool = require('../config/database').pool;

const customerModel = {
  // Find all customers with pagination
  async findAll({ page = 1, limit = 10, search = '', userType, branchId }) {
    const offset = (page - 1) * limit;
    
    let whereClause = '1=1';
    let params = [];
    
    if (userType !== 'admin' && branchId) {
      whereClause += ' AND BranchID = ?';
      params.push(branchId);
    }
    
    if (search) {
      whereClause += ' AND (Name LIKE ? OR PhoneNo LIKE ? OR Email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    // Get total count
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM tblcustomer WHERE ${whereClause}`,
      params
    );
    const total = countResult[0].total;
    
    // Get paginated data
    const [rows] = await pool.query(
      `SELECT 
        AID as id, 
        Name as name, 
        PhoneNo as phone,
        Address as address,
        Email as email
       FROM tblcustomer 
       WHERE ${whereClause}
       ORDER BY AID DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
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

  // Find all for dropdown (no pagination)
  async findAllForDropdown({ userType, branchId } = {}) {
    let whereClause = '1=1';
    let params = [];

    if (userType !== 'admin' && branchId) {
      whereClause += ' AND BranchID = ?';
      params.push(branchId);
    }

    const [rows] = await pool.query(
      `SELECT AID as id, Name as name, PhoneNo as phone, Address as address FROM tblcustomer WHERE ${whereClause} ORDER BY Name`,
      params
    );
    return rows;
  },

  // Find by ID
  async findById(id, { userType, branchId } = {}) {
    let whereClause = 'AID = ?';
    let params = [id];

    if (userType !== 'admin' && branchId) {
      whereClause += ' AND BranchID = ?';
      params.push(branchId);
    }

    const [rows] = await pool.query(
      `SELECT 
        AID as id, 
        Name as name, 
        PhoneNo as phone,
        Address as address,
        Email as email
       FROM tblcustomer WHERE ${whereClause}`,
      params
    );
    return rows[0] || null;
  },

  // Create new customer
  async create({ name, phone, address, email, branchId }) {
    const [result] = await pool.query(
      'INSERT INTO tblcustomer (Name, PhoneNo, Address, Email, BranchID) VALUES (?, ?, ?, ?, ?)',
      [name, phone || '', address || '', email || '', branchId]
    );
    return this.findById(result.insertId, { branchId });
  },

  // Update customer
  async update(id, { name, phone, address, email, userType, branchId }) {
    let whereClause = 'AID = ?';
    let params = [name, phone || '', address || '', email || '', id];

    if (userType !== 'admin' && branchId) {
      whereClause += ' AND BranchID = ?';
      params.push(branchId);
    }

    const [result] = await pool.query(
      `UPDATE tblcustomer SET Name = ?, PhoneNo = ?, Address = ?, Email = ? WHERE ${whereClause}`,
      params
    );
    
    if (result.affectedRows === 0) {
      return null;
    }
    
    return this.findById(id, { userType, branchId });
  },

  // Delete customer
  async delete(id, { userType, branchId } = {}) {
    let whereClause = 'AID = ?';
    let params = [id];

    if (userType !== 'admin' && branchId) {
      whereClause += ' AND BranchID = ?';
      params.push(branchId);
    }

    const [result] = await pool.query(`DELETE FROM tblcustomer WHERE ${whereClause}`, params);
    return result.affectedRows > 0;
  },

  // Check if phone number exists (for validation)
  async phoneExists(phone, excludeId = null) {
    if (!phone) return false;
    
    let query = 'SELECT COUNT(*) as count FROM tblcustomer WHERE PhoneNo = ?';
    let params = [phone];
    
    if (excludeId) {
      query += ' AND AID != ?';
      params.push(excludeId);
    }
    
    const [result] = await pool.query(query, params);
    return result[0].count > 0;
  }
};

module.exports = customerModel;

