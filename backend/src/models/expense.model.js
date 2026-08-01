const pool = require('../config/database').pool;

const expenseModel = {
  // Find all expenses with pagination and filters
  async findAll({ page = 1, limit = 10, search = '', categoryId = '', fromDate = '', toDate = '', userType = 'admin', branchId = null }) {
    const offset = (page - 1) * limit;
    
    let whereConditions = ['1=1'];
    let params = [];

    if (userType !== 'admin' && branchId) {
      whereConditions.push('e.BranchID = ?');
      params.push(branchId);
    }
    
    // Search by Reason (description)
    if (search) {
      whereConditions.push('e.Reason LIKE ?');
      params.push(`%${search}%`);
    }
    
    // Filter by CategoryID
    if (categoryId) {
      whereConditions.push('e.ExpenseCategoryID = ?');
      params.push(categoryId);
    }
    
    // Filter by date range
    if (fromDate) {
      whereConditions.push('e.Date >= ?');
      params.push(fromDate);
    }
    
    if (toDate) {
      whereConditions.push('e.Date <= ?');
      params.push(toDate);
    }
    
    const whereClause = whereConditions.join(' AND ');
    
    // Get total count
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM tblexpense e WHERE ${whereClause}`,
      params
    );
    const total = countResult[0].total;
    
    // Get paginated data with JOIN for category name
    const [rows] = await pool.query(
      `SELECT 
        e.AID as id,
        e.Reason as description,
        e.Amount as amount,
        e.Date as date,
        e.ExpenseCategoryID as categoryId,
        COALESCE(c.Name, '') as categoryName,
        e.BranchID as branchId,
        b.BranchName as branchName
      FROM tblexpense e
      LEFT JOIN tblexpense_category c ON e.ExpenseCategoryID = c.AID
      LEFT JOIN tblbranch b ON e.BranchID = b.AID
      WHERE ${whereClause}
      ORDER BY e.Date DESC, e.AID DESC
      LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    
    // Format date for frontend
    const formattedRows = rows.map(row => ({
      ...row,
      date: row.date ? new Date(row.date).toISOString().split('T')[0] : ''
    }));
    
    return {
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
  },

  // Find by ID
  async findById(id, { userType, branchId } = {}) {
    let whereClause = 'e.AID = ?';
    let params = [id];

    if (userType !== 'admin' && branchId) {
      whereClause += ' AND e.BranchID = ?';
      params.push(branchId);
    }

    const [rows] = await pool.query(
      `SELECT 
        e.AID as id,
        e.Reason as description,
        e.Amount as amount,
        e.Date as date,
        e.ExpenseCategoryID as categoryId,
        COALESCE(c.Name, '') as categoryName,
        e.BranchID as branchId,
        b.BranchName as branchName
      FROM tblexpense e
      LEFT JOIN tblexpense_category c ON e.ExpenseCategoryID = c.AID
      LEFT JOIN tblbranch b ON e.BranchID = b.AID
      WHERE ${whereClause}`,
      params
    );
    
    if (rows[0]) {
      rows[0].date = rows[0].date ? new Date(rows[0].date).toISOString().split('T')[0] : '';
    }
    
    return rows[0] || null;
  },

  // Create new expense
  async create({ description, amount, date, categoryId, branchId }) {
    const [result] = await pool.query(
      'INSERT INTO tblexpense (Reason, Amount, Date, ExpenseCategoryID, BranchID) VALUES (?, ?, ?, ?, ?)',
      [description, amount, date, categoryId || null, branchId]
    );
    return this.findById(result.insertId, { branchId });
  },

  // Update expense
  async update(id, { description, amount, date, categoryId, userType, branchId }) {
    let whereClause = 'AID = ?';
    let params = [description, amount, date, categoryId || null, id];

    if (userType !== 'admin' && branchId) {
      whereClause += ' AND BranchID = ?';
      params.push(branchId);
    }

    const [result] = await pool.query(
      `UPDATE tblexpense SET Reason = ?, Amount = ?, Date = ?, ExpenseCategoryID = ? WHERE ${whereClause}`,
      params
    );
    
    if (result.affectedRows === 0) {
      return null;
    }
    
    return this.findById(id, { userType, branchId });
  },

  // Delete expense
  async delete(id, { userType, branchId } = {}) {
    let whereClause = 'AID = ?';
    let params = [id];

    if (userType !== 'admin' && branchId) {
      whereClause += ' AND BranchID = ?';
      params.push(branchId);
    }

    const [result] = await pool.query(`DELETE FROM tblexpense WHERE ${whereClause}`, params);
    return result.affectedRows > 0;
  },

  // Get total expenses by date range
  async getTotalByDateRange(fromDate, toDate, { userType, branchId } = {}) {
    let whereClause = '1=1';
    let params = [];

    if (userType !== 'admin' && branchId) {
      whereClause += ' AND BranchID = ?';
      params.push(branchId);
    }
    
    if (fromDate) {
      whereClause += ' AND Date >= ?';
      params.push(fromDate);
    }
    
    if (toDate) {
      whereClause += ' AND Date <= ?';
      params.push(toDate);
    }
    
    const [result] = await pool.query(
      `SELECT COALESCE(SUM(Amount), 0) as total FROM tblexpense WHERE ${whereClause}`,
      params
    );
    
    return result[0].total;
  }
};

module.exports = expenseModel;

