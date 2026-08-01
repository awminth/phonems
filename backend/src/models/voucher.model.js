const pool = require('../config/database').pool;

const voucherModel = {
  // Create voucher record
  async create({ vno, customerId, totalQty, totalAmt, dis, tax, total, cash, refund, credit, chk, userId, paymentMethod, date, branchId }) {
    const [result] = await pool.query(
      `INSERT INTO tblvoucher (VNO, CustomerID, TotalQty, TotalAmt, Dis, Tax, Total, Cash, Refund, Credit, Chk, PaymentMethod, UserID, Date, BranchID) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [vno, customerId || null, totalQty, totalAmt, dis || 0, tax || 0, total, cash || 0, refund || 0, credit || 0, chk, paymentMethod || chk, userId, date, branchId]
    );
    return result.insertId;
  },

  // Get voucher by VNO
  async findByVNO(vno, { userType, branchId } = {}) {
    let whereClause = 'v.VNO = ?';
    let params = [vno];

    if (userType !== 'admin' && branchId) {
      whereClause += ' AND v.BranchID = ?';
      params.push(branchId);
    }

    const [rows] = await pool.query(
      `SELECT 
        v.VNO as vno,
        v.CustomerID as customerId,
        c.Name as customerName,
        v.TotalQty as totalQty,
        v.TotalAmt as subTotal,
        v.Dis as discount,
        v.Tax as tax,
        v.OtherAmt as otherAmt,
        v.OtherType as otherType,
        v.OtherValue as otherValue,
        v.Total as total,
        v.Cash as cash,
        v.Refund as refund,
        v.Credit as credit,
        v.Chk as paymentType,
        v.PaymentMethod as paymentMethod,
        v.UserID as userId,
        u.UserName as cashier,
        v.Date as date,
        v.BranchID as branchId,
        b.BranchName as branchName,
        b.InvoiceHeaderName as branchInvoiceName,
        b.Address as branchAddress,
        b.PhoneNo as branchPhone,
        b.Logo as branchLogo,
        b.IncludeLogo as branchIncludeLogo
       FROM tblvoucher v
       LEFT JOIN tblcustomer c ON v.CustomerID = c.AID
       LEFT JOIN tbluser u ON v.UserID = u.AID
       LEFT JOIN tblbranch b ON v.BranchID = b.AID
       WHERE ${whereClause}`,
      params
    );
    return rows[0] || null;
  },

  // Get return voucher by VNO
  async findReturnVoucherByVNO(vno, { userType, branchId } = {}) {
    let whereClause = 'v.VNO = ?';
    let params = [vno];

    if (userType !== 'admin' && branchId) {
      whereClause += ' AND v.BranchID = ?';
      params.push(branchId);
    }

    const [rows] = await pool.query(
      `SELECT 
        v.VNO as vno,
        v.CustomerID as customerId,
        c.Name as customerName,
        c.PhoneNo as customerPhone,
        c.Address as customerAddress,
        (SELECT SUM(ReturnQty) FROM tblsale_return WHERE VNO = v.VNO) as totalQty,
        v.OriginalTotal as subTotal,
        0 as discount,
        0 as tax,
        v.RefundTotal as total,
        v.UserID as userId,
        u.UserName as cashier,
        0 as cash,
        v.RefundTotal as refund,
        0 as credit,
        v.Date as date,
        'Return' as paymentType,
        v.Reason as reason,
        v.BranchID as branchId,
        b.BranchName as branchName,
        b.InvoiceHeaderName as branchInvoiceName,
        b.Address as branchAddress,
        b.PhoneNo as branchPhone,
        b.Logo as branchLogo,
        b.IncludeLogo as branchIncludeLogo
       FROM tblsale_return_voucher v
       LEFT JOIN tblcustomer c ON v.CustomerID = c.AID
       LEFT JOIN tbluser u ON v.UserID = u.AID
       LEFT JOIN tblbranch b ON v.BranchID = b.AID
       WHERE ${whereClause}`,
      params
    );
    return rows[0] || null;
  },

  // Get all vouchers with pagination
  async findAll({ page = 1, limit = 10, search = '', fromDate = '', toDate = '', customerId = '', userType, branchId }) {
    const offset = (page - 1) * limit;

    let whereClause = '1=1';
    let params = [];

    if (userType !== 'admin' && branchId) {
      whereClause += ' AND v.BranchID = ?';
      params.push(branchId);
    }

    if (search) {
      whereClause += ' AND v.VNO LIKE ?';
      params.push(`%${search}%`);
    }

    if (customerId) {
      whereClause += ' AND v.CustomerID = ?';
      params.push(customerId);
    }

    if (fromDate) {
      whereClause += ' AND DATE(v.Date) >= ?';
      params.push(fromDate);
    }

    if (toDate) {
      whereClause += ' AND DATE(v.Date) <= ?';
      params.push(toDate);
    }

    // Get total count
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM tblvoucher v WHERE ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // Get paginated data
    const [rows] = await pool.query(
      `SELECT 
        v.VNO as vno,
        v.CustomerID as customerId,
        c.Name as customerName,
        v.TotalQty as totalQty,
        v.TotalAmt as subTotal,
        v.Dis as discount,
        v.Tax as tax,
        v.OtherAmt as otherAmt,
        v.OtherType as otherType,
        v.OtherValue as otherValue,
        v.Total as total,
        v.Cash as cash,
        v.Refund as refund,
        v.Credit as credit,
        v.Chk as paymentType,
        v.PaymentMethod as paymentMethod,
        v.UserID as userId,
        v.Date as date,
        COALESCE(b.BranchName, 'Unknown') as branchName
       FROM tblvoucher v
       LEFT JOIN tblcustomer c ON v.CustomerID = c.AID
       LEFT JOIN tblbranch b ON v.BranchID = b.AID
       WHERE ${whereClause}
       ORDER BY v.Date DESC, v.VNO DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return {
      data: rows,
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

  // Check if VNO exists
  async vnoExists(vno) {
    const [result] = await pool.query(
      'SELECT COUNT(*) as count FROM tblvoucher WHERE VNO = ?',
      [vno]
    );
    return result[0].count > 0;
  },

  // Get next VNO (Folio No: 0000001 format)
  async getNextVNO() {
    // Look for the highest numeric VNO
    const [result] = await pool.query(
      `SELECT VNO FROM tblvoucher WHERE VNO REGEXP '^[0-9]+$' ORDER BY CAST(VNO AS UNSIGNED) DESC LIMIT 1`
    );

    let counter = 1;
    if (result.length > 0) {
      counter = parseInt(result[0].VNO) + 1;
    }

    return counter.toString().padStart(7, '0');
  }
};

module.exports = voucherModel;
