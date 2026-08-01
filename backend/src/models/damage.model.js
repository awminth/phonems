const pool = require('../config/database').pool;

const damageModel = {
  // Create damage record
  async create({ productId, qty, date, reason, branchId, userId, stockId, imei }, conn = null) {
    const db = conn || pool;
    const [result] = await db.query(
      `INSERT INTO tbldamage (ProductID, Qty, Date, Reason, BranchID, UserID, StockID, Imei) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [productId, qty, date || new Date(), reason, branchId, userId, stockId || null, imei || null]
    );
    return result.insertId;
  },

  // Find all damage records with pagination and filters
  async findAll({ page = 1, limit = 10, search = '', fromDate = '', toDate = '', branchId = null }) {
    const offset = (page - 1) * limit;
    let whereConditions = ['1=1'];
    let params = [];

    if (branchId) {
      whereConditions.push('d.BranchID = ?');
      params.push(branchId);
    }

    if (search) {
      whereConditions.push('(p.Name LIKE ? OR p.CodeNo LIKE ? OR d.Imei LIKE ?)');
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    if (fromDate) {
      whereConditions.push('DATE(d.Date) >= ?');
      params.push(fromDate);
    }

    if (toDate) {
      whereConditions.push('DATE(d.Date) <= ?');
      params.push(toDate);
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM tbldamage d 
       LEFT JOIN tblproduct p ON d.ProductID = p.AID 
       WHERE ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // Get paginated data
    const [rows] = await pool.query(
      `SELECT 
        d.AID as id,
        d.ProductID as productId,
        p.Name as productName,
        p.CodeNo as codeNo,
        d.Qty as qty,
        d.Date as date,
        d.Reason as reason,
        d.BranchID as branchId,
        b.BranchName as branchName,
        d.UserID as userId,
        u.UserName as userName,
        d.StockID as stockId,
        d.Imei as imei
       FROM tbldamage d
       LEFT JOIN tblproduct p ON d.ProductID = p.AID
       LEFT JOIN tblbranch b ON d.BranchID = b.AID
       LEFT JOIN tbluser u ON d.UserID = u.AID
       WHERE ${whereClause}
       ORDER BY d.Date DESC
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

  // Find by ID
  async findById(id, conn = null) {
    const db = conn || pool;
    const [rows] = await db.query(
      `SELECT * FROM tbldamage WHERE AID = ?`,
      [id]
    );
    return rows[0] || null;
  },

  // Delete damage record
  async delete(id, conn = null) {
    const db = conn || pool;
    const [result] = await db.query(
      'DELETE FROM tbldamage WHERE AID = ?',
      [id]
    );
    return result.affectedRows > 0;
  }
};

module.exports = damageModel;
