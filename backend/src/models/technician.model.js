const pool = require('../config/database').pool;

let tableChecked = false;

async function ensureTableExists() {
  if (tableChecked) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tbltechnician (
        AID INT AUTO_INCREMENT PRIMARY KEY,
        Name VARCHAR(255) NOT NULL,
        Phone VARCHAR(50) NULL,
        Specialty VARCHAR(255) NULL,
        Note TEXT NULL,
        Status VARCHAR(20) NOT NULL DEFAULT 'Active',
        BranchID INT NULL,
        CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    tableChecked = true;
  } catch (error) {
    console.error('Error creating tbltechnician table:', error.message);
  }
}

const technicianModel = {
  // Find all technicians with pagination and search
  async findAll({ page = 1, limit = 10, search = '', userType, branchId }) {
    await ensureTableExists();
    const offset = (page - 1) * limit;

    let whereConditions = ['1=1'];
    let params = [];

    if (userType !== 'admin' && branchId) {
      whereConditions.push('(t.BranchID = ? OR t.BranchID IS NULL)');
      params.push(branchId);
    } else if (branchId && branchId !== 'all') {
      whereConditions.push('t.BranchID = ?');
      params.push(branchId);
    }

    if (search) {
      whereConditions.push('(t.Name LIKE ? OR t.Phone LIKE ? OR t.Specialty LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereClause = whereConditions.join(' AND ');

    // Total count
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM tbltechnician t WHERE ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // Paginated rows
    const [rows] = await pool.query(
      `SELECT 
        t.AID as id,
        t.Name as name,
        t.Phone as phone,
        t.Specialty as specialty,
        t.Note as note,
        t.Status as status,
        t.BranchID as branchId,
        b.BranchName as branchName,
        t.CreatedAt as createdAt
       FROM tbltechnician t
       LEFT JOIN tblbranch b ON t.BranchID = b.AID
       WHERE ${whereClause}
       ORDER BY t.AID DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const formattedRows = rows.map(row => ({
      ...row,
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

  // Find active technicians for dropdown
  async findActive({ userType, branchId } = {}) {
    await ensureTableExists();
    let whereConditions = ["t.Status = 'Active'"];
    let params = [];

    if (userType !== 'admin' && branchId) {
      whereConditions.push('(t.BranchID = ? OR t.BranchID IS NULL)');
      params.push(branchId);
    }

    const [rows] = await pool.query(
      `SELECT 
        t.AID as id,
        t.Name as name,
        t.Phone as phone,
        t.Specialty as specialty
       FROM tbltechnician t
       WHERE ${whereConditions.join(' AND ')}
       ORDER BY t.Name ASC`,
      params
    );

    return rows;
  },

  // Find by ID
  async findById(id, { userType, branchId } = {}) {
    await ensureTableExists();
    let whereConditions = ['t.AID = ?'];
    let params = [id];

    if (userType !== 'admin' && branchId) {
      whereConditions.push('(t.BranchID = ? OR t.BranchID IS NULL)');
      params.push(branchId);
    }

    const [rows] = await pool.query(
      `SELECT 
        t.AID as id,
        t.Name as name,
        t.Phone as phone,
        t.Specialty as specialty,
        t.Note as note,
        t.Status as status,
        t.BranchID as branchId,
        b.BranchName as branchName
       FROM tbltechnician t
       LEFT JOIN tblbranch b ON t.BranchID = b.AID
       WHERE ${whereConditions.join(' AND ')}`,
      params
    );

    if (rows[0]) {
      rows[0].isActive = rows[0].status === 'Active';
    }

    return rows[0] || null;
  },

  // Create technician
  async create({ name, phone, specialty, note, status, branchId }) {
    await ensureTableExists();
    const finalStatus = status || 'Active';
    const finalBranchId = branchId || null;

    const [result] = await pool.query(
      'INSERT INTO tbltechnician (Name, Phone, Specialty, Note, Status, BranchID) VALUES (?, ?, ?, ?, ?, ?)',
      [name, phone || null, specialty || null, note || null, finalStatus, finalBranchId]
    );

    return this.findById(result.insertId);
  },

  // Update technician
  async update(id, { name, phone, specialty, note, status, branchId, userType }) {
    await ensureTableExists();
    let whereClause = 'AID = ?';
    let params = [name, phone || null, specialty || null, note || null, status || 'Active', branchId || null, id];

    if (userType !== 'admin' && branchId) {
      whereClause += ' AND (BranchID = ? OR BranchID IS NULL)';
      params.push(branchId);
    }

    const [result] = await pool.query(
      `UPDATE tbltechnician SET Name = ?, Phone = ?, Specialty = ?, Note = ?, Status = ?, BranchID = ? WHERE ${whereClause}`,
      params
    );

    if (result.affectedRows === 0) return null;

    return this.findById(id, { userType, branchId });
  },

  // Delete technician
  async delete(id, { userType, branchId } = {}) {
    await ensureTableExists();
    let whereClause = 'AID = ?';
    let params = [id];

    if (userType !== 'admin' && branchId) {
      whereClause += ' AND (BranchID = ? OR BranchID IS NULL)';
      params.push(branchId);
    }

    const [result] = await pool.query(`DELETE FROM tbltechnician WHERE ${whereClause}`, params);
    return result.affectedRows > 0;
  }
};

module.exports = technicianModel;
