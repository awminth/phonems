const mysql = require('mysql2/promise');

// Database Configuration
// DB_* from backend/.env (see .env.example)
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'mt_phonems',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
};

// Create Connection Pool
const pool = mysql.createPool(dbConfig);

// Auto-check schema
const ensureColumnsExist = async () => {
  try {
    const [columns] = await pool.query("SHOW COLUMNS FROM tblproduct LIKE 'IsService'");
    if (columns.length === 0) {
      await pool.query("ALTER TABLE tblproduct ADD COLUMN IsService TINYINT(1) NOT NULL DEFAULT 0");
      console.log("Column 'IsService' added successfully to tblproduct.");
    }

    const [sparePartCols] = await pool.query("SHOW COLUMNS FROM tblproduct LIKE 'IsSparePart'");
    if (sparePartCols.length === 0) {
      await pool.query("ALTER TABLE tblproduct ADD COLUMN IsSparePart TINYINT(1) NOT NULL DEFAULT 0");
      console.log("Column 'IsSparePart' added successfully to tblproduct.");
    }

    // Verify and add specification column to tblpurchase_items
    const [purchaseItemCols] = await pool.query("SHOW COLUMNS FROM tblpurchase_items LIKE 'specification'");
    if (purchaseItemCols.length === 0) {
      await pool.query("ALTER TABLE tblpurchase_items ADD COLUMN specification VARCHAR(255) NULL");
      console.log("Column 'specification' added successfully to tblpurchase_items.");
    }

    // Verify and create tbltechnician table
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

    // Verify and add TechnicianID column to tblserviceticket if tblserviceticket exists
    try {
      const [techCols] = await pool.query("SHOW COLUMNS FROM tblserviceticket LIKE 'TechnicianID'");
      if (techCols.length === 0) {
        await pool.query("ALTER TABLE tblserviceticket ADD COLUMN TechnicianID INT NULL AFTER CustomerID");
        console.log("Column 'TechnicianID' added successfully to tblserviceticket.");
      }
    } catch (err) {
      // tblserviceticket will be created by serviceticketModel if it doesn't exist yet
    }
  } catch (error) {
    console.error("Error verifying/adding columns in database:", error.message);
  }
};

// Test Connection
const testConnection = async () => {
  let connection;
  try {
    connection = await pool.getConnection();
    console.log('Database connected successfully');
    await ensureColumnsExist();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    return false;
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

module.exports = {
  pool,
  testConnection
};
