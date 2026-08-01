const pool = require('../config/database').pool;

// Get print settings
const getPrintSettings = async (branchId = null) => {
  try {
    if (branchId) {
      const [rows] = await pool.query(
        `SELECT AID, InvoiceHeaderName as ShopName, Address, PhoneNo, Logo, IncludeLogo as ChkLogo, FooterMessage, WarrantyPolicy
         FROM tblbranch 
         WHERE AID = ?`,
        [branchId]
      );
      
      if (rows.length > 0) {
        return rows[0];
      }
    }

    // If no branchId provided or branch not found, try to get the first branch as default
    const [rows] = await pool.query(
      `SELECT AID, InvoiceHeaderName as ShopName, Address, PhoneNo, Logo, IncludeLogo as ChkLogo, FooterMessage, WarrantyPolicy
       FROM tblbranch 
       ORDER BY AID ASC 
       LIMIT 1`
    );
    
    if (rows.length === 0) {
      return {
        AID: null,
        ShopName: 'POS System',
        Address: '',
        PhoneNo: '',
        Logo: '',
        ChkLogo: 0,
        FooterMessage: '',
        WarrantyPolicy: ''
      };
    }
    
    return rows[0];
  } catch (error) {
    console.error('getPrintSettings error:', error);
    throw error;
  }
};

// Update print settings
const updatePrintSettings = async (data, branchId = null) => {
  try {
    const { ShopName, Address, PhoneNo, Logo, ChkLogo, FooterMessage, WarrantyPolicy } = data;
    
    // If no branchId, update the first branch as default
    let targetBranchId = branchId;
    if (!targetBranchId) {
      const [firstBranch] = await pool.query('SELECT AID FROM tblbranch ORDER BY AID ASC LIMIT 1');
      if (firstBranch.length > 0) {
        targetBranchId = firstBranch[0].AID;
      }
    }

    if (targetBranchId) {
      await pool.query(
        `UPDATE tblbranch 
         SET InvoiceHeaderName = ?, Address = ?, PhoneNo = ?, Logo = ?, IncludeLogo = ?, FooterMessage = ?, WarrantyPolicy = ? 
         WHERE AID = ?`,
        [ShopName || '', Address || '', PhoneNo || '', Logo || '', ChkLogo || 0, FooterMessage || '', WarrantyPolicy || '', targetBranchId]
      );
      return { ...data, AID: targetBranchId };
    }

    return { ...data, error: 'No branch found to update' };
  } catch (error) {
    console.error('updatePrintSettings error:', error);
    throw error;
  }
};

module.exports = {
  getPrintSettings,
  updatePrintSettings
};
