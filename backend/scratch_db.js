require('dotenv').config();
const pool = require('./src/config/database').pool;

async function check() {
  try {
    const [rows] = await pool.query('SELECT AID, CodeNo, Name, IsSerialized, IsService, IsSparePart, StockQty FROM tblproduct LIMIT 50');
    console.log('--- ALL PRODUCTS ---');
    console.log(rows);
    
    const [services] = await pool.query('SELECT AID, CodeNo, Name, IsSerialized, IsService, IsSparePart, StockQty FROM tblproduct WHERE IsService = 1');
    console.log('--- SERVICE PRODUCTS ---');
    console.log(services);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

check();
