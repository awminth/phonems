const { pool } = require('../config/database');
const { cache } = require('../config/redis');

// Cache key prefix
const CACHE_PREFIX = 'balance_report';

// Get Payable Report (Suppliers with outstanding balance)
const getPayableReport = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    const { userType, branchId: userBranchId } = req.user;
    
    // Branch Filtering
    const branchId = userType === 'admin' ? (req.query.branchId || 'all') : userBranchId;
    
    const cacheKey = `${CACHE_PREFIX}:payable:${page}:${limit}:${search}:${branchId || 'all'}`;

    // Try cache
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return res.json({ success: true, ...cachedData, fromCache: true });
    }
    const dynamicTotalPaid = `COALESCE((SELECT SUM(Amt) FROM tblsupplierpay sp WHERE sp.VNO = p.invoice_no), 0)`;
    const dynamicBalance = `(p.net_amount - ${dynamicTotalPaid})`;

    let whereClause = `${dynamicBalance} > 0`;
    let params = [];

    if (branchId !== 'all') {
      whereClause += ' AND p.BranchID = ?';
      params.push(branchId);
    }

    if (search) {
      whereClause += ' AND (p.invoice_no LIKE ? OR s.Supplier LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    // Query to get outstanding purchases
    const query = `
      SELECT 
        p.purchase_id as id,
        p.invoice_no as vno,
        p.supplier_id as supplierId,
        s.Supplier as name,
        s.PhoneNo as phone,
        p.net_amount as totalPurchases,
        ${dynamicTotalPaid} as totalPaid,
        ${dynamicBalance} as balance,
        p.purchase_date as date,
        p.BranchID as branchId,
        b.BranchName as branchName
      FROM tblpurchases p
      LEFT JOIN tblsupplier s ON p.supplier_id = s.AID
      LEFT JOIN tblbranch b ON p.BranchID = b.AID
      WHERE ${whereClause}
      ORDER BY p.purchase_date DESC, p.invoice_no DESC
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(*) as total 
      FROM tblpurchases p
      LEFT JOIN tblsupplier s ON p.supplier_id = s.AID
      WHERE ${whereClause}
    `;

    const [rows] = await pool.query(query, [...params, limit, offset]);
    const [countResult] = await pool.query(countQuery, params);
    const total = countResult[0].total;

    // Calculate totals for the summary card
    const [summaryResult] = await pool.query(`
      SELECT 
        COALESCE(SUM(p.net_amount), 0) as grandTotalPurchases,
        COALESCE(SUM(${dynamicTotalPaid}), 0) as grandTotalPaid,
        COALESCE(SUM(${dynamicBalance}), 0) as grandTotalBalance
      FROM tblpurchases p
      LEFT JOIN tblsupplier s ON p.supplier_id = s.AID
      WHERE ${whereClause}
    `, params);

    const result = {
      data: rows,
      totals: summaryResult[0],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };

    await cache.set(cacheKey, result, 120);

    res.json({ success: true, ...result, fromCache: false });
  } catch (error) {
    console.error('getPayableReport error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch payable report' });
  }
};

// Get Receivable Report (Credit Vouchers)
const getReceivableReport = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    const { userType, branchId: userBranchId } = req.user;
    
    // Branch Filtering
    const branchId = userType === 'admin' ? (req.query.branchId || 'all') : userBranchId;
    
    const cacheKey = `${CACHE_PREFIX}:receivable:vouchers:${page}:${limit}:${search}:${branchId || 'all'}`;

    // Try cache
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return res.json({ success: true, ...cachedData, fromCache: true });
    }
    let whereClause = "v.Chk = 'Credit' AND v.Credit > 0";
    let params = [];

    if (branchId !== 'all') {
      whereClause += ' AND v.BranchID = ?';
      params.push(branchId);
    }

    if (search) {
      whereClause += ' AND (v.VNO LIKE ? OR c.Name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const query = `
      SELECT 
        v.AID as id,
        v.VNO as vno,
        v.CustomerID as customerId,
        COALESCE(c.Name, 'Unknown') as name,
        c.PhoneNo as phone,
        v.Total as totalAmount,
        v.Credit as balance,
        v.Date as date,
        v.BranchID as branchId,
        b.BranchName as branchName
      FROM tblvoucher v
      LEFT JOIN tblcustomer c ON v.CustomerID = c.AID
      LEFT JOIN tblbranch b ON v.BranchID = b.AID
      WHERE ${whereClause}
      ORDER BY v.Date DESC, v.VNO DESC
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(*) as total 
      FROM tblvoucher v
      LEFT JOIN tblcustomer c ON v.CustomerID = c.AID
      WHERE ${whereClause}
    `;

    const [rows] = await pool.query(query, [...params, limit, offset]);
    const [countResult] = await pool.query(countQuery, params);
    const total = countResult[0].total;

    const [summaryResult] = await pool.query(`
      SELECT 
        COALESCE(SUM(v.Total), 0) as grandTotalAmount,
        COALESCE(SUM(v.Credit), 0) as grandTotalBalance
      FROM tblvoucher v
      LEFT JOIN tblcustomer c ON v.CustomerID = c.AID
      WHERE ${whereClause}
    `, params);

    const result = {
      data: rows,
      totals: {
        grandTotalCreditSales: summaryResult[0].grandTotalAmount,
        grandTotalPaid: summaryResult[0].grandTotalAmount - summaryResult[0].grandTotalBalance,
        grandTotalBalance: summaryResult[0].grandTotalBalance
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };

    await cache.set(cacheKey, result, 120);
    res.json({ success: true, ...result, fromCache: false });
  } catch (error) {
    console.error('getReceivableReport error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch receivable report' });
  }
};

// Get Supplier History (Payments and Purchases)
const getSupplierHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { userType, branchId } = req.user;

    let paymentQuery = `SELECT sp.AID as id, sp.Amt as amount, sp.Date as date, u.Username as cashier, sp.VNO as vno
        FROM tblsupplierpay sp
        LEFT JOIN tbluser u ON sp.UserID = u.AID
        WHERE sp.SupplierID = ?`;
    
    let purchaseQuery = `SELECT p.purchase_id as id, p.net_amount as amount, p.purchase_date as date, p.purchase_id as purchaseId, p.invoice_no as vno
        FROM tblpurchases p
        WHERE p.supplier_id = ?`;
        
    let queryParams = [id];

    if (userType !== 'admin' && branchId) {
      paymentQuery += ' AND (sp.BranchID = ? OR sp.BranchID IS NULL)';
      purchaseQuery += ' AND (p.BranchID = ? OR p.BranchID IS NULL)';
      queryParams.push(branchId);
    }

    paymentQuery += ' ORDER BY sp.Date DESC';
    purchaseQuery += ' ORDER BY p.purchase_date DESC';

    // Get payments
    const [payments] = await pool.query(paymentQuery, queryParams);

    // Get purchases
    const [purchases] = await pool.query(purchaseQuery, queryParams);

    res.json({
      success: true,
      data: {
        payments,
        purchases
      }
    });
  } catch (error) {
    console.error('getSupplierHistory error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch supplier history' });
  }
};


// Get Customer History (Payments for Voucher)
const getCustomerHistory = async (req, res) => {
  try {
    const { id } = req.params; // This is the AID of tblvoucher

    // Get VNO first
    const [voucher] = await pool.query('SELECT VNO FROM tblvoucher WHERE AID = ?', [id]);
    if (voucher.length === 0) return res.status(404).json({ success: false, message: 'Voucher not found' });
    
    const vno = voucher[0].VNO;

    const { userType, branchId } = req.user;
    let paymentQuery = `SELECT cd.AID as id, cd.VNO as vno, cd.Amt as amount, cd.Date as date, cd.PaymentMethod as method, u.Username as cashier
       FROM tblcreditdetail cd
       LEFT JOIN tbluser u ON cd.UserID = u.AID
       WHERE cd.VNO = ?`;
    let queryParams = [vno];

    if (userType !== 'admin' && branchId) {
      paymentQuery += ' AND cd.BranchID = ?';
      queryParams.push(branchId);
    }

    paymentQuery += ' ORDER BY cd.Date DESC';

    const [payments] = await pool.query(paymentQuery, queryParams);

    res.json({
      success: true,
      data: payments
    });
  } catch (error) {
    console.error('getCustomerHistory error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch payment details' });
  }
};


module.exports = {
  getPayableReport,
  getReceivableReport,
  getSupplierHistory,
  getCustomerHistory
};

