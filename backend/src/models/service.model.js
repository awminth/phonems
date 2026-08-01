const pool = require('../config/database').pool;

let tableChecked = false;

async function ensureTableExists() {
  if (tableChecked) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tblservice (
        AID INT AUTO_INCREMENT PRIMARY KEY,
        ServiceCode VARCHAR(50) NOT NULL,
        ServiceName VARCHAR(255) NOT NULL,
        Price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        Description TEXT,
        Status VARCHAR(20) NOT NULL DEFAULT 'Active',
        BranchID INT,
        CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_service_code (ServiceCode)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    tableChecked = true;
    console.log('tblservice table verified/created successfully.');
  } catch (error) {
    console.error('Error creating tblservice table:', error.message);
  }
}

const serviceModel = {
  // Find all services with pagination
  async findAll({ page = 1, limit = 10, search = '', userType, branchId }) {
    await ensureTableExists();
    const offset = (page - 1) * limit;
    
    let whereClause = '1=1';
    let params = [];
    
    if (userType !== 'admin' && branchId) {
      whereClause += ' AND (BranchID = ? OR BranchID IS NULL)';
      params.push(branchId);
    }
    
    if (search) {
      whereClause += ' AND (ServiceName LIKE ? OR ServiceCode LIKE ? OR Description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    // Get total count
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM tblservice WHERE ${whereClause}`,
      params
    );
    const total = countResult[0].total;
    
    // Get paginated data
    const [rows] = await pool.query(
      `SELECT 
        s.AID as id, 
        s.ServiceCode as serviceCode, 
        s.ServiceName as serviceName,
        s.Price as price,
        s.Description as description,
        s.Status as status,
        s.BranchID as branchId,
        b.BranchName as branchName
       FROM tblservice s
       LEFT JOIN tblbranch b ON s.BranchID = b.AID
       WHERE ${whereClause.replace(/\bBranchID\b/g, 's.BranchID')}
       ORDER BY s.AID DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    
    // Convert price to number
    const formattedRows = rows.map(row => ({
      ...row,
      price: parseFloat(row.price || 0),
      isActive: row.status === 'Active'
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
    await ensureTableExists();
    let whereClause = 's.AID = ?';
    let params = [id];

    if (userType !== 'admin' && branchId) {
      whereClause += ' AND (s.BranchID = ? OR s.BranchID IS NULL)';
      params.push(branchId);
    }

    const [rows] = await pool.query(
      `SELECT 
        s.AID as id, 
        s.ServiceCode as serviceCode, 
        s.ServiceName as serviceName,
        s.Price as price,
        s.Description as description,
        s.Status as status,
        s.BranchID as branchId,
        b.BranchName as branchName
       FROM tblservice s 
       LEFT JOIN tblbranch b ON s.BranchID = b.AID
       WHERE ${whereClause}`,
      params
    );
    
    if (rows[0]) {
      rows[0].price = parseFloat(rows[0].price || 0);
      rows[0].isActive = rows[0].status === 'Active';
    }
    
    return rows[0] || null;
  },

  // Create new service
  async create({ serviceCode, serviceName, price, description, status, branchId }) {
    await ensureTableExists();
    const finalBranchId = branchId || null;
    const finalStatus = status || 'Active';
    const finalPrice = price || 0;
    
    const [result] = await pool.query(
      'INSERT INTO tblservice (ServiceCode, ServiceName, Price, Description, Status, BranchID) VALUES (?, ?, ?, ?, ?, ?)',
      [serviceCode, serviceName, finalPrice, description || '', finalStatus, finalBranchId]
    );
    
    return this.findById(result.insertId);
  },

  // Update service
  async update(id, { serviceCode, serviceName, price, description, status, userType, branchId }) {
    await ensureTableExists();
    let whereClause = 'AID = ?';
    let params = [serviceCode, serviceName, price || 0, description || '', status || 'Active', branchId || null, id];

    if (userType !== 'admin' && branchId) {
      whereClause += ' AND (BranchID = ? OR BranchID IS NULL)';
      params.push(branchId);
    }

    // Replace the placeholder AID in params with branchId verification if non-admin
    const [result] = await pool.query(
      `UPDATE tblservice SET ServiceCode = ?, ServiceName = ?, Price = ?, Description = ?, Status = ?, BranchID = ? WHERE ${whereClause}`,
      params
    );
    
    if (result.affectedRows === 0) {
      return null;
    }
    
    return this.findById(id, { userType, branchId });
  },

  // Delete service
  async delete(id, { userType, branchId } = {}) {
    await ensureTableExists();
    let whereClause = 'AID = ?';
    let params = [id];

    if (userType !== 'admin' && branchId) {
      whereClause += ' AND (BranchID = ? OR BranchID IS NULL)';
      params.push(branchId);
    }

    const [result] = await pool.query(`DELETE FROM tblservice WHERE ${whereClause}`, params);
    return result.affectedRows > 0;
  },

  // Check if service code exists (for validation)
  async codeExists(serviceCode, excludeId = null) {
    await ensureTableExists();
    let query = 'SELECT COUNT(*) as count FROM tblservice WHERE ServiceCode = ?';
    let params = [serviceCode];
    
    if (excludeId) {
      query += ' AND AID != ?';
      params.push(excludeId);
    }
    
    const [result] = await pool.query(query, params);
    return result[0].count > 0;
  }
};

module.exports = serviceModel;
