const pool = require('../config/database').pool;

const expenseCategoryModel = {
  // Find all expense categories with pagination
  async findAll({ page = 1, limit = 10, search = '' }) {
    const offset = (page - 1) * limit;
    
    let whereClause = '1=1';
    let params = [];
    
    if (search) {
      whereClause += ' AND Name LIKE ?';
      params.push(`%${search}%`);
    }
    
    // Get total count
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM tblexpense_category WHERE ${whereClause}`,
      params
    );
    const total = countResult[0].total;
    
    // Get paginated data
    const [rows] = await pool.query(
      `SELECT AID as id, Name as name 
       FROM tblexpense_category 
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
  async findAllForDropdown() {
    const [rows] = await pool.query(
      'SELECT AID as id, Name as name FROM tblexpense_category ORDER BY Name'
    );
    return rows;
  },

  // Find by ID
  async findById(id) {
    const [rows] = await pool.query(
      'SELECT AID as id, Name as name FROM tblexpense_category WHERE AID = ?',
      [id]
    );
    return rows[0] || null;
  },

  // Create new expense category
  async create({ name }) {
    const [result] = await pool.query(
      'INSERT INTO tblexpense_category (Name) VALUES (?)',
      [name]
    );
    return this.findById(result.insertId);
  },

  // Update expense category
  async update(id, { name }) {
    const [result] = await pool.query(
      'UPDATE tblexpense_category SET Name = ? WHERE AID = ?',
      [name, id]
    );
    
    if (result.affectedRows === 0) {
      return null;
    }
    
    return this.findById(id);
  },

  // Delete expense category
  async delete(id) {
    const [result] = await pool.query(
      'DELETE FROM tblexpense_category WHERE AID = ?',
      [id]
    );
    return result.affectedRows > 0;
  }
};

module.exports = expenseCategoryModel;

