const { pool } = require('../config/database');

// Table: tblcategory
// Columns: AID (Primary Key), Category (Name)

const categoryModel = {
  // Find all categories with pagination
  async findAll({ page = 1, limit = 10, search = '' }) {
    const offset = (page - 1) * limit;
    
    let query = 'SELECT * FROM tblcategory';
    let countQuery = 'SELECT COUNT(*) as total FROM tblcategory';
    const params = [];
    const countParams = [];
    
    // Add search condition
    if (search) {
      query += ' WHERE Category LIKE ?';
      countQuery += ' WHERE Category LIKE ?';
      params.push(`%${search}%`);
      countParams.push(`%${search}%`);
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
        name: row.Category
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

  // Find category by ID
  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM tblcategory WHERE AID = ?', [id]);
    
    if (rows.length === 0) {
      return null;
    }
    
    const row = rows[0];
    return {
      id: row.AID.toString(),
      name: row.Category
    };
  },

  // Create new category
  async create({ name }) {
    const [result] = await pool.query(
      'INSERT INTO tblcategory (Category) VALUES (?)',
      [name]
    );
    
    return {
      id: result.insertId.toString(),
      name
    };
  },

  // Update category
  async update(id, { name }) {
    const [result] = await pool.query(
      'UPDATE tblcategory SET Category = ? WHERE AID = ?',
      [name, id]
    );
    
    if (result.affectedRows === 0) {
      return null;
    }
    
    return this.findById(id);
  },

  // Delete category
  async delete(id) {
    const [result] = await pool.query('DELETE FROM tblcategory WHERE AID = ?', [id]);
    return result.affectedRows > 0;
  }
};

module.exports = categoryModel;
