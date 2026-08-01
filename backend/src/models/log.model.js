const pool = require('../config/database').pool;

const logModel = {
  // Find all logs with pagination (by userId optional)
  async findAll({ page = 1, limit = 10, search = '', userId = null, userType = 'admin', branchId = null }) {
    const offset = (page - 1) * limit;
    
    let whereClause = '1=1';
    let params = [];

    if (userType !== 'admin' && branchId) {
      whereClause += ' AND l.BranchID = ?';
      params.push(branchId);
    }
    
    if (userId) {
      whereClause += ' AND l.UserID = ?';
      params.push(userId);
    }
    
    if (search) {
      whereClause += ' AND (l.Description LIKE ? OR u.UserName LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    // Get total count
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total 
       FROM tbllog l 
       LEFT JOIN tbluser u ON l.UserID = u.AID 
       WHERE ${whereClause}`,
      params
    );
    const total = countResult[0].total;
    
    // Get paginated data
    const [rows] = await pool.query(
      `SELECT 
        l.AID as id, 
        l.Description as description, 
        l.UserID as userId,
        u.UserName as username,
        l.Date as date,
        l.IPAddress as ipAddress
       FROM tbllog l
       LEFT JOIN tbluser u ON l.UserID = u.AID
       WHERE ${whereClause}
       ORDER BY l.AID DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    
    // Format the data
    const formattedRows = rows.map(row => ({
      id: row.id,
      description: row.description,
      userId: row.userId,
      user: row.username || 'Unknown',
      action: extractAction(row.description),
      date: formatDate(row.date),
      ip: row.ipAddress || '127.0.0.1'
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

  // Find logs by user ID
  async findByUserId({ userId, page = 1, limit = 10, search = '', userType = 'admin', branchId = null }) {
    return this.findAll({ page, limit, search, userId, userType, branchId });
  },

  // Create new log entry with IP address
  async create({ description, userId, ipAddress = '127.0.0.1', branchId = null }) {
    const [result] = await pool.query(
      'INSERT INTO tbllog (Description, UserID, Date, IPAddress, BranchID) VALUES (?, ?, NOW(), ?, ?)',
      [description, userId, ipAddress, branchId]
    );
    return result.insertId;
  },

  // Delete old logs (optional cleanup)
  async deleteOldLogs(daysOld = 90) {
    const [result] = await pool.query(
      'DELETE FROM tbllog WHERE Date < DATE_SUB(NOW(), INTERVAL ? DAY)',
      [daysOld]
    );
    return result.affectedRows;
  }
};

// Helper function to extract action from description
function extractAction(description) {
  if (!description) return 'Unknown';
  
  if (description.includes('logged in')) return 'Login';
  if (description.includes('logged out')) return 'Logout';
  if (description.includes('changed password')) return 'Password Change';
  if (description.includes('created')) return 'Create';
  if (description.includes('updated')) return 'Update';
  if (description.includes('deleted')) return 'Delete';
  
  return 'Action';
}

// Helper function to format date
function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
}

module.exports = logModel;

