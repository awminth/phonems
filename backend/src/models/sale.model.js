const pool = require('../config/database').pool;

const saleModel = {
  // Create sale record
  async create({ remainId, itemName, qty, sellPrice, date, vno, customerId, codeNo, branchId }) {
    const [result] = await pool.query(
      `INSERT INTO tblsale (RemainID, ItemName, Qty, SellPrice, Date, VNO, CustomerID, CodeNo, BranchID) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [remainId, itemName, qty, sellPrice, date, vno, customerId || null, codeNo, branchId]
    );
    return result.insertId;
  },

  // Create multiple sale records (batch insert)
  async createBatch(items, branchId) {
    if (items.length === 0) return [];
    
    const values = items.map(item => [
      item.remainId,
      item.itemName,
      item.qty,
      item.sellPrice,
      item.date,
      item.vno,
      item.customerId || null,
      item.codeNo,
      branchId
    ]);
    
    const placeholders = items.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
    const flatValues = values.flat();
    
    const [result] = await pool.query(
      `INSERT INTO tblsale (RemainID, ItemName, Qty, SellPrice, Date, VNO, CustomerID, CodeNo, BranchID) 
       VALUES ${placeholders}`,
      flatValues
    );
    
    return result.insertId;
  },

  // Get sales by VNO
  async findByVNO(vno, { userType, branchId } = {}) {
    let whereClause = 's.VNO = ?';
    let params = [vno];

    if (userType !== 'admin' && branchId) {
      whereClause += ' AND s.BranchID = ?';
      params.push(branchId);
    }

    const [rows] = await pool.query(
      `SELECT 
        s.AID as id,
        s.RemainID as remainId,
        s.ItemName as itemName,
        s.Qty as qty,
        s.SellPrice as sellPrice,
        s.Date as date,
        s.VNO as vno,
        s.CustomerID as customerId,
        s.CodeNo as codeNo
       FROM tblsale s
       WHERE ${whereClause}
       ORDER BY s.AID`,
      params
    );
    return rows;
  },

  // Update product stock qty after sale
  async updateRemainQty(remainId, soldQty) {
    const [result] = await pool.query(
      `UPDATE tblproduct SET StockQty = StockQty - ? WHERE AID = ? AND StockQty >= ?`,
      [soldQty, remainId, soldQty]
    );
    return result.affectedRows > 0;
  }
};

module.exports = saleModel;

