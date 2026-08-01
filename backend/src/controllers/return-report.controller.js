const pool = require('../config/database').pool;
const voucherModel = require('../models/voucher.model');
const { cache } = require('../config/redis');

// Cache key prefix
const CACHE_PREFIX = 'return_report';

// Get return reports (Chk='Return')
const getReturnReports = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const fromDate = req.query.fromDate || '';
    const toDate = req.query.toDate || '';
    const customerId = req.query.customerId || '';

    const offset = (page - 1) * limit;

    const { userType, branchId: userBranchId } = req.user;
    let whereClause = "1=1";
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
      `SELECT COUNT(*) as total FROM tblsale_return_voucher v WHERE ${whereClause}`,
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
        (SELECT GROUP_CONCAT(DISTINCT RegisterKey SEPARATOR ', ') FROM tblsale WHERE VNO = v.VNO AND RegisterKey IS NOT NULL AND RegisterKey != '') as imeis
       FROM tblsale_return_voucher v
       LEFT JOIN tblcustomer c ON v.CustomerID = c.AID
       LEFT JOIN tbluser u ON v.UserID = u.AID
       LEFT JOIN tblbranch b ON v.BranchID = b.AID
       WHERE ${whereClause}
       ORDER BY v.Date DESC, v.AID DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    // Calculate totals
    const [totalsResult] = await pool.query(
      `SELECT 
        COALESCE(SUM(v.RefundTotal), 0) as totalAmount,
        0 as totalCash,
        COALESCE(SUM(v.RefundTotal), 0) as totalRefund,
        0 as totalTax
       FROM tblsale_return_voucher v
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
    console.error('getReturnReports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch return reports'
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
    const voucher = await voucherModel.findReturnVoucherByVNO(vno, { userType, branchId });

    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Voucher not found'
      });
    }

    // Get return items
    const [saleRows] = await pool.query(
      `SELECT 
        sr.AID as id,
        p.Name as itemName,
        sr.ReturnQty as qty,
        sr.Price as sellPrice,
        sr.Date as date,
        sr.VNO as vno,
        v.CustomerID as customerId,
        sr.RemainID as remainId,
        p.CodeNo as codeNo,
        (SELECT RegisterKey FROM tblsale WHERE VNO = sr.VNO AND RemainID = sr.RemainID LIMIT 1) as imei
       FROM tblsale_return sr
       JOIN tblsale_return_voucher v ON sr.VNO = v.VNO
       LEFT JOIN tblproduct p ON sr.RemainID = p.AID
       WHERE sr.VNO = ?
       ORDER BY sr.AID`,
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

module.exports = {
  getReturnReports,
  getVoucherDetailsByVNO
};

