const pool = require('../config/database').pool;

const userModel = {
  // Find all users with pagination
  async findAll({ page = 1, limit = 10, search = '', userType = 'admin', branchId = null }) {
    const offset = (page - 1) * limit;
    
    let whereClause = '1=1';
    let params = [];
    
    if (userType !== 'admin' && branchId) {
      whereClause += ' AND BranchID = ?';
      params.push(branchId);
    }

    if (search) {
      whereClause += ' AND UserName LIKE ?';
      params.push(`%${search}%`);
    }
    
    // Get total count
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM tbluser WHERE ${whereClause}`,
      params
    );
    const total = countResult[0].total;
    
    // Get paginated data
    const [rows] = await pool.query(
      `SELECT 
        u.AID as id, 
        u.UserName as username, 
        u.Status as status,
        u.Permission as permissions,
        u.UserType as userType,
        u.BranchID as branchId,
        b.BranchName as branchName
      FROM tbluser u
      LEFT JOIN tblbranch b ON u.BranchID = b.AID
      WHERE ${whereClause.replace(/\bUserName\b/g, 'u.UserName').replace(/\bBranchID\b/g, 'u.BranchID')}
      ORDER BY u.AID DESC
      LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    
    // Parse permissions string to array
    const formattedRows = rows.map(row => ({
      ...row,
      isActive: row.status === 'Active' || row.status === '1' || row.status === 'true',
      permissions: row.permissions ? row.permissions.split(',').map(p => p.trim()).filter(p => p) : []
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
  async findById(id) {
    const [rows] = await pool.query(
      `SELECT 
        u.AID as id, 
        u.UserName as username, 
        u.Status as status,
        u.Permission as permissions,
        u.UserType as userType,
        u.BranchID as branchId,
        b.BranchName as branchName
       FROM tbluser u
       LEFT JOIN tblbranch b ON u.BranchID = b.AID
       WHERE u.AID = ?`,
      [id]
    );
    
    if (rows[0]) {
      rows[0].isActive = rows[0].status === 'Active' || rows[0].status === '1' || rows[0].status === 'true';
      rows[0].permissions = rows[0].permissions ? rows[0].permissions.split(',').map(p => p.trim()).filter(p => p) : [];
    }
    
    return rows[0] || null;
  },

  // Find by username (for login/validation)
  async findByUsername(username) {
    const [rows] = await pool.query(
      `SELECT 
        u.AID as id, 
        u.UserName as username, 
        u.Password as password,
        u.Status as status,
        u.Permission as permissions,
        u.UserType as userType,
        u.BranchID as branchId
       FROM tbluser u WHERE u.UserName = ?`,
      [username]
    );
    
    if (rows[0]) {
      rows[0].isActive = rows[0].status === 'Active' || rows[0].status === '1' || rows[0].status === 'true';
      rows[0].permissions = rows[0].permissions ? rows[0].permissions.split(',').map(p => p.trim()).filter(p => p) : [];
    }
    
    return rows[0] || null;
  },

  // Create new user
  async create({ username, password, isActive, permissions, userType, branchId }) {
    const status = isActive ? 'Active' : 'Inactive';
    const permissionsStr = Array.isArray(permissions) ? permissions.join(',') : '';
    const finalBranchId = userType === 'admin' ? null : branchId;
    
    const [result] = await pool.query(
      'INSERT INTO tbluser (UserName, Password, Status, Permission, UserType, BranchID) VALUES (?, ?, ?, ?, ?, ?)',
      [username, password, status, permissionsStr, userType || 'user', finalBranchId]
    );
    
    return this.findById(result.insertId);
  },

  // Update user
  async update(id, { username, password, isActive, permissions, userType, branchId }) {
    const status = isActive ? 'Active' : 'Inactive';
    const permissionsStr = Array.isArray(permissions) ? permissions.join(',') : '';
    const finalBranchId = userType === 'admin' ? null : branchId;
    
    let query, params;
    
    if (password) {
      // Update with new password
      query = 'UPDATE tbluser SET UserName = ?, Password = ?, Status = ?, Permission = ?, UserType = ?, BranchID = ? WHERE AID = ?';
      params = [username, password, status, permissionsStr, userType || 'user', finalBranchId, id];
    } else {
      // Update without changing password
      query = 'UPDATE tbluser SET UserName = ?, Status = ?, Permission = ?, UserType = ?, BranchID = ? WHERE AID = ?';
      params = [username, status, permissionsStr, userType || 'user', finalBranchId, id];
    }
    
    const [result] = await pool.query(query, params);
    
    if (result.affectedRows === 0) {
      return null;
    }
    
    return this.findById(id);
  },

  // Delete user
  async delete(id) {
    const [result] = await pool.query(
      'DELETE FROM tbluser WHERE AID = ?',
      [id]
    );
    return result.affectedRows > 0;
  },

  // Check if username exists (for validation)
  async usernameExists(username, excludeId = null) {
    let query = 'SELECT COUNT(*) as count FROM tbluser WHERE UserName = ?';
    let params = [username];
    
    if (excludeId) {
      query += ' AND AID != ?';
      params.push(excludeId);
    }
    
    const [result] = await pool.query(query, params);
    return result[0].count > 0;
  },

  // Find by ID with password (for password change verification)
  async findByIdWithPassword(id) {
    const [rows] = await pool.query(
      `SELECT 
        AID as id, 
        UserName as username, 
        Password as password,
        Status as status,
        Permission as permissions
       FROM tbluser WHERE AID = ?`,
      [id]
    );
    
    if (rows[0]) {
      rows[0].isActive = rows[0].status === 'Active' || rows[0].status === '1' || rows[0].status === 'true';
      rows[0].permissions = rows[0].permissions ? rows[0].permissions.split(',').map(p => p.trim()).filter(p => p) : [];
    }
    
    return rows[0] || null;
  },

  // Update password only
  async updatePassword(id, newPassword) {
    const [result] = await pool.query(
      'UPDATE tbluser SET Password = ? WHERE AID = ?',
      [newPassword, id]
    );
    return result.affectedRows > 0;
  }
};

module.exports = userModel;

