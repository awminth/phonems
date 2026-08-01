const pool = require('../config/database').pool;
const voucherModel = require('../models/voucher.model');
const { cache } = require('../config/redis');

// Cache key prefix
const CACHE_PREFIX = 'credit_report';

// Get credit reports (Chk='Credit' and Credit > 0)
const getCreditReports = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const fromDate = req.query.fromDate || '';
    const toDate = req.query.toDate || '';
    const customerId = req.query.customerId || '';

    const offset = (page - 1) * limit;

    const { userType, branchId: userBranchId } = req.user;
    let whereClause = "v.Chk = 'Credit'";
    let params = [];

    // Branch Filtering
    const branchId = userType === 'admin' ? (req.query.branchId || 'all') : userBranchId;
    if (branchId !== 'all') {
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

    // Generate cache key
    const cacheKey = `${CACHE_PREFIX}:list:${page}:${limit}:${search}:${fromDate}:${toDate}:${customerId}:${branchId || 'all'}`;

    // Try cache
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        ...cachedData,
        fromCache: true
      });
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
        v.AID as id,
        v.VNO as vno,
        v.CustomerID as customerId,
        c.Name as customerName,
        v.TotalQty as totalQty,
        v.TotalAmt as subTotal,
        v.Dis as discount,
        v.Tax as tax,
        v.Total as total,
        v.UserID as userId,
        u.UserName as cashier,
        v.Cash as cash,
        v.Refund as refund,
        v.Credit as credit,
        v.Date as date,
        v.Chk as paymentType,
        v.OtherAmt as otherAmt,
        v.BranchID as branchId,
        b.BranchName as branchName,
        (SELECT GROUP_CONCAT(DISTINCT RegisterKey SEPARATOR ', ') FROM tblsale WHERE VNO = v.VNO AND RegisterKey IS NOT NULL AND RegisterKey != '') as imeis,
        COALESCE(pur.purchasePrice, 0) as purchasePrice,
        (v.Total - COALESCE(pur.purchasePrice, 0)) as profit
       FROM tblvoucher v
       LEFT JOIN tblcustomer c ON v.CustomerID = c.AID
       LEFT JOIN tbluser u ON v.UserID = u.AID
       LEFT JOIN tblbranch b ON v.BranchID = b.AID
       LEFT JOIN (
         SELECT 
           s.VNO,
           SUM(s.Qty * p.PurchasePrice) as purchasePrice
         FROM tblsale s
         JOIN tblproduct p ON s.RemainID = p.AID
         GROUP BY s.VNO
       ) pur ON v.VNO = pur.VNO
       WHERE ${whereClause}
       ORDER BY v.Date DESC, v.VNO DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    // Calculate totals
    const [totalsResult] = await pool.query(
      `SELECT 
        COALESCE(SUM(v.Total), 0) as totalAmount,
        COALESCE(SUM(v.Cash), 0) as totalCash,
        COALESCE(SUM(v.Credit), 0) as totalCredit,
        COALESCE(SUM(v.Tax), 0) as totalTax,
        COALESCE(SUM(v.OtherAmt), 0) as totalOther,
        COALESCE(SUM(pur.purchasePrice), 0) as totalPurchasePrice,
        COALESCE(SUM(v.Total - COALESCE(pur.purchasePrice, 0)), 0) as totalProfit
       FROM tblvoucher v
       LEFT JOIN (
         SELECT 
           s.VNO,
           SUM(s.Qty * p.PurchasePrice) as purchasePrice
         FROM tblsale s
         JOIN tblproduct p ON s.RemainID = p.AID
         GROUP BY s.VNO
       ) pur ON v.VNO = pur.VNO
       WHERE ${whereClause}`,
      params
    );

    const result = {
      data: rows,
      totals: totalsResult[0],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };

    // Cache for 2 minutes
    await cache.set(cacheKey, result, 120);

    res.json({
      success: true,
      ...result,
      fromCache: false
    });
  } catch (error) {
    console.error('getCreditReports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch credit reports'
    });
  }
};

// Get voucher details by VNO (for print/view)
const getVoucherDetailsByVNO = async (req, res) => {
  try {
    const { vno } = req.params;

    const cacheKey = `${CACHE_PREFIX}:voucher:${vno}`;

    // Try cache
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        data: cachedData,
        fromCache: true
      });
    }

    // Get voucher info using the centralized model
    const { userType, branchId } = req.user;
    const voucher = await voucherModel.findByVNO(vno, { userType, branchId });

    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Voucher not found'
      });
    }

    // Get sale items
    const [saleRows] = await pool.query(
      `SELECT 
        s.AID as id,
        s.ItemName as itemName,
        s.Qty as qty,
        s.SellPrice as sellPrice,
        s.Date as date,
        s.VNO as vno,
        s.CustomerID as customerId,
        s.RemainID as remainId,
        s.CodeNo as codeNo,
        s.RegisterKey as imei
       FROM tblsale s
       WHERE s.VNO = ?
       ORDER BY s.AID`,
      [vno]
    );

    const result = {
      voucher: voucher,
      items: saleRows
    };

    // Cache for 5 minutes
    await cache.set(cacheKey, result, 300);

    res.json({
      success: true,
      data: result,
      fromCache: false
    });
  } catch (error) {
    console.error('getVoucherDetailsByVNO error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch voucher details'
    });
  }
};

// Get payment details from tblcreditdetail by VNO
const getPaymentDetailsByVNO = async (req, res) => {
  try {
    const { vno } = req.params;

    const cacheKey = `${CACHE_PREFIX}:payments:${vno}`;

    // Try cache
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        data: cachedData,
        fromCache: true
      });
    }

    // Get payment details from tblcreditdetail
    const [paymentRows] = await pool.query(
      `SELECT 
        cd.AID as id,
        cd.VNO as vno,
        cd.CustomerID as customerId,
        c.Name as customerName,
        cd.Amt as amount,
        cd.Date as date,
        cd.UserID as userId,
        u.UserName as userName
       FROM tblcreditdetail cd
       LEFT JOIN tblcustomer c ON cd.CustomerID = c.AID
       LEFT JOIN tbluser u ON cd.UserID = u.AID
       WHERE cd.VNO = ?`,
      [vno]
    );

    if (paymentRows.length > 0) {
       const { userType, branchId } = req.user;
       if (userType !== 'admin' && branchId && paymentRows[0].BranchID && paymentRows[0].BranchID != branchId) {
          // If we want to strictly isolate payment history too
          return res.status(403).json({
            success: false,
            message: 'Access denied: Payment belongs to another branch'
          });
       }
    }

    // Get voucher info for context
    const [voucherRows] = await pool.query(
      `SELECT 
        v.VNO as vno,
        v.CustomerID as customerId,
        c.Name as customerName,
        v.Total as voucherTotal,
        v.Credit as remainingCredit,
        v.Cash as totalCash,
        v.Date as voucherDate
       FROM tblvoucher v
       LEFT JOIN tblcustomer c ON v.CustomerID = c.AID
       WHERE v.VNO = ?`,
      [vno]
    );

    // Calculate total paid
    const totalPaid = paymentRows.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

    const result = {
      voucher: voucherRows[0] || null,
      payments: paymentRows,
      totalPaid: totalPaid
    };

    // Cache for 2 minutes
    await cache.set(cacheKey, result, 120);

    res.json({
      success: true,
      data: result,
      fromCache: false
    });
  } catch (error) {
    console.error('getPaymentDetailsByVNO error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment details'
    });
  }
};

module.exports = {
  getCreditReports,
  getVoucherDetailsByVNO,
  getPaymentDetailsByVNO
};

