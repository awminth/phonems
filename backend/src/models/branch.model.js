const { pool } = require('../config/database');

const branchModel = {
  // Find all branches
  async findAll() {
    const [rows] = await pool.query('SELECT * FROM tblbranch ORDER BY AID DESC');
    return rows.map(row => ({
      id: row.AID.toString(),
      branchId: row.BranchID,
      name: row.BranchName,
      invoiceHeaderName: row.InvoiceHeaderName,
      address: row.Address,
      phoneNo: row.PhoneNo,
      logo: row.Logo,
      includeLogo: row.IncludeLogo === 1,
      footerMessage: row.FooterMessage,
      warrantyPolicy: row.WarrantyPolicy
    }));
  },

  // Find branch by ID
  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM tblbranch WHERE AID = ?', [id]);
    if (rows.length === 0) return null;
    
    const row = rows[0];
    return {
      id: row.AID.toString(),
      branchId: row.BranchID,
      name: row.BranchName,
      invoiceHeaderName: row.InvoiceHeaderName,
      address: row.Address,
      phoneNo: row.PhoneNo,
      logo: row.Logo,
      includeLogo: row.IncludeLogo === 1,
      footerMessage: row.FooterMessage,
      warrantyPolicy: row.WarrantyPolicy
    };
  },

  // Create new branch
  async create(data) {
    const { branchId, name, invoiceHeaderName, address, phoneNo, logo, includeLogo, footerMessage, warrantyPolicy } = data;
    const [result] = await pool.query(
      `INSERT INTO tblbranch (BranchID, BranchName, InvoiceHeaderName, Address, PhoneNo, Logo, IncludeLogo, FooterMessage, WarrantyPolicy) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [branchId, name, invoiceHeaderName, address, phoneNo, logo, includeLogo ? 1 : 0, footerMessage, warrantyPolicy]
    );
    return { id: result.insertId.toString(), ...data };
  },

  // Update branch
  async update(id, data) {
    const { branchId, name, invoiceHeaderName, address, phoneNo, logo, includeLogo, footerMessage, warrantyPolicy } = data;
    const [result] = await pool.query(
      `UPDATE tblbranch SET 
        BranchID = ?, 
        BranchName = ?, 
        InvoiceHeaderName = ?, 
        Address = ?, 
        PhoneNo = ?, 
        Logo = ?, 
        IncludeLogo = ?, 
        FooterMessage = ?, 
        WarrantyPolicy = ? 
       WHERE AID = ?`,
      [branchId, name, invoiceHeaderName, address, phoneNo, logo, includeLogo ? 1 : 0, footerMessage, warrantyPolicy, id]
    );
    if (result.affectedRows === 0) return null;
    return this.findById(id);
  },

  // Delete branch
  async delete(id) {
    const [result] = await pool.query('DELETE FROM tblbranch WHERE AID = ?', [id]);
    return result.affectedRows > 0;
  }
};

module.exports = branchModel;
