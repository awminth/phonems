const mysql = require('mysql2/promise');

// Database Configuration
const dbConfig = {
  host: process.env.DB_HOST || '72.61.126.206',
  user: process.env.DB_USER || 'root_nc',
  password: process.env.DB_PASSWORD || 'ncpassword',
  database: process.env.DB_NAME || 'phonepos',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
};

// Create Connection Pool
const pool = mysql.createPool(dbConfig);

// Test Connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    return false;
  }
};

module.exports = {
  pool,
  testConnection
};
