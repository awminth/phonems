const pool = require('../config/database').pool;
const voucherModel = require('../models/voucher.model');
const { cache } = require('../config/redis');
const logModel = require('../models/log.model');

// Cache key prefixes
const CACHE_PREFIX = {
  CASH: 'cash_sale',
  CREDIT: 'credit_sale',
  RETURN: 'return_sale'
};

// Helper to get client IP address
const getClientIP = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIP = req.headers['x-real-ip'];
  if (realIP) {
    return realIP;
  }
  return (
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip ||
    '127.0.0.1'
  );
};

// ============ CASH SALES ============

// Get cash sales (Chk='Cash')
const getCashSales = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const fromDate = req.query.fromDate || '';
    const toDate = req.query.toDate || '';
    const customerId = req.query.customerId || '';
    const brandId = req.query.brandId || '';

    const offset = (page - 1) * limit;

    const { userType, branchId: userBranchId } = req.user;
    let whereClause = "v.Chk = 'Cash'";
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

    if (brandId) {
      whereClause += ' AND v.VNO IN (SELECT VNO FROM tblsale s JOIN tblproduct p ON s.RemainID = p.AID WHERE p.CategoryID = ?)';
      params.push(brandId);
    }

    const cacheKey = `${CACHE_PREFIX.CASH}:list:${page}:${limit}:${search}:${fromDate}:${toDate}:${customerId}:${brandId}:${branchId || 'all'}`;

    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return res.json({ success: true, ...cachedData, fromCache: true });
    }

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM tblvoucher v WHERE ${whereClause}`,
      params
    );
    const total = countResult[0].total;

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
        v.OtherAmt as otherAmt,
        v.Total as total,
        v.UserID as userId,
        u.UserName as cashier,
        v.Cash as cash,
        v.Refund as refund,
        (SELECT COUNT(*) FROM tblsale_return_voucher WHERE VNO = v.VNO) as returnCount,
        v.Date as date,
        v.Chk as paymentType,
        v.BranchID as branchId,
        b.BranchName as branchName,
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

    const [totalsResult] = await pool.query(
      `SELECT 
        COALESCE(SUM(v.TotalAmt), 0) as totalSubTotal,
        COALESCE(SUM(v.Dis), 0) as totalDiscount,
        COALESCE(SUM(v.Tax), 0) as totalTax,
        COALESCE(SUM(v.OtherAmt), 0) as totalOther,
        COALESCE(SUM(v.Total), 0) as totalAmount,
        COALESCE(SUM(v.Cash), 0) as totalCash,
        COALESCE(SUM(v.Refund), 0) as totalRefund,
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

    await cache.set(cacheKey, result, 120);

    res.json({ success: true, ...result, fromCache: false });
  } catch (error) {
    console.error('getCashSales error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch cash sales' });
  }
};

// ============ CREDIT SALES ============

// Get credit sales (Chk='Credit' and Credit > 0)
const getCreditSales = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const fromDate = req.query.fromDate || '';
    const toDate = req.query.toDate || '';
    const customerId = req.query.customerId || '';
    const brandId = req.query.brandId || '';

    const offset = (page - 1) * limit;

    const { userType, branchId: userBranchId } = req.user;
    let whereClause = "v.Chk = 'Credit' AND v.Credit > 0";
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

    if (brandId) {
      whereClause += ' AND v.VNO IN (SELECT VNO FROM tblsale s JOIN tblproduct p ON s.RemainID = p.AID WHERE p.CategoryID = ?)';
      params.push(brandId);
    }

    const cacheKey = `${CACHE_PREFIX.CREDIT}:list:${page}:${limit}:${search}:${fromDate}:${toDate}:${customerId}:${brandId}:${branchId || 'all'}`;

    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return res.json({ success: true, ...cachedData, fromCache: true });
    }

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM tblvoucher v WHERE ${whereClause}`,
      params
    );
    const total = countResult[0].total;

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
        v.OtherAmt as otherAmt,
        v.Total as total,
        v.UserID as userId,
        u.UserName as cashier,
        v.Cash as cash,
        v.Refund as refund,
        (SELECT COUNT(*) FROM tblsale_return_voucher WHERE VNO = v.VNO) as returnCount,
        v.Credit as credit,
        v.Date as date,
        v.Chk as paymentType,
        v.BranchID as branchId,
        b.BranchName as branchName,
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

    const [totalsResult] = await pool.query(
      `SELECT 
        COALESCE(SUM(v.TotalAmt), 0) as totalSubTotal,
        COALESCE(SUM(v.Dis), 0) as totalDiscount,
        COALESCE(SUM(v.Tax), 0) as totalTax,
        COALESCE(SUM(v.OtherAmt), 0) as totalOther,
        COALESCE(SUM(v.Total), 0) as totalAmount,
        COALESCE(SUM(v.Credit), 0) as totalCredit,
        COALESCE(SUM(v.Refund), 0) as totalRefund,
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

    await cache.set(cacheKey, result, 120);

    res.json({ success: true, ...result, fromCache: false });
  } catch (error) {
    console.error('getCreditSales error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch credit sales' });
  }
};

// Pay credit - insert to tblcreditdetail and update tblvoucher (Cash += amt, Credit -= amt)
const payCredit = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { vno, customerId, amount, userId, username = '', paymentMethod = 'Cash' } = req.body;
    const clientIP = getClientIP(req);

    if (!vno || !amount) {
      return res.status(400).json({ success: false, message: 'VNO and amount are required' });
    }

    await connection.beginTransaction();

    // Get current voucher
    const [voucher] = await connection.query(
      `SELECT Cash, Credit FROM tblvoucher WHERE VNO = ?`,
      [vno]
    );

    if (voucher.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Voucher not found' });
    }

    const currentCash = voucher[0].Cash || 0;
    const currentCredit = voucher[0].Credit || 0;

    if (amount > currentCredit) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Payment amount exceeds credit balance' });
    }

    // Insert into tblcreditdetail
    await connection.query(
      `INSERT INTO tblcreditdetail (VNO, CustomerID, Amt, Date, UserID, PaymentMethod, BranchID) VALUES (?, ?, ?, NOW(), ?, ?, ?)`,
      [vno, customerId || null, amount, userId || null, paymentMethod, req.user.branchId]
    );

    // Update tblvoucher: Cash += amount, Credit -= amount
    const newCash = currentCash + amount;
    const newCredit = currentCredit - amount;
    await connection.query(
      `UPDATE tblvoucher SET Cash = ?, Credit = ? WHERE VNO = ?`,
      [newCash, newCredit, vno]
    );

    await connection.commit();

    // Clear cache
    await cache.delPattern(`${CACHE_PREFIX.CREDIT}:*`);
    await cache.delPattern(`customer_payments:*`);
    await cache.delPattern(`voucher_detail:*`);
    await cache.delPattern(`financial:*`);

    // Log credit payment
    try {
      await logModel.create({
        description: `Credit payment for VNO ${vno} amount ${amount} by ${username || 'Unknown'}`,
        userId: userId || null,
        ipAddress: clientIP
      });
    } catch (logErr) {
      console.error('log credit payment error:', logErr);
    }

    res.json({
      success: true,
      message: 'Credit payment recorded successfully',
      data: {
        vno,
        previousCash: currentCash,
        newCash: newCash,
        previousCredit: currentCredit,
        paidAmount: amount,
        remainingCredit: newCredit
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('payCredit error:', error);
    res.status(500).json({ success: false, message: 'Failed to process credit payment' });
  } finally {
    connection.release();
  }
};

// Get credit payment history for a VNO
const getCreditHistory = async (req, res) => {
  try {
    const { vno } = req.params;

    let query = `SELECT 
        cd.AID as id,
        cd.VNO as vno,
        cd.CustomerID as customerId,
        COALESCE(c.Name, 'Unknown') as customerName,
        cd.Amt as amount,
        cd.Date as date,
        cd.UserID as userId,
        cd.PaymentMethod as paymentMethod,
        u.UserName as userName
       FROM tblcreditdetail cd
       LEFT JOIN tblcustomer c ON cd.CustomerID = c.AID
       LEFT JOIN tbluser u ON cd.UserID = u.AID
       WHERE cd.VNO = ?`;
    let queryParams = [vno];

    const { userType, branchId } = req.user;
    if (userType !== 'admin' && branchId) {
      query += ' AND cd.BranchID = ?';
      queryParams.push(branchId);
    }

    query += ' ORDER BY cd.Date DESC';

    const [rows] = await pool.query(query, queryParams);

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('getCreditHistory error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch credit history' });
  }
};

// ============ RETURN SALES ============

// Get return sales from tblsale_return_voucher and tblsale_return
const getReturnSales = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const fromDate = req.query.fromDate || '';
    const toDate = req.query.toDate || '';
    const customerId = req.query.customerId || '';
    const brandId = req.query.brandId || '';

    const offset = (page - 1) * limit;

    const { userType, branchId: userBranchId } = req.user;
    let whereClause = '1=1';
    let params = [];

    // Branch Filtering
    const branchId = userType === 'admin' ? (req.query.branchId || 'all') : userBranchId;
    if (branchId !== 'all') {
      whereClause += ' AND srv.BranchID = ?';
      params.push(branchId);
    }

    if (search) {
      whereClause += ' AND srv.VNO LIKE ?';
      params.push(`%${search}%`);
    }

    if (customerId) {
      whereClause += ' AND srv.CustomerID = ?';
      params.push(customerId);
    }

    if (fromDate) {
      whereClause += ' AND DATE(srv.Date) >= ?';
      params.push(fromDate);
    }

    if (toDate) {
      whereClause += ' AND DATE(srv.Date) <= ?';
      params.push(toDate);
    }

    if (brandId) {
      whereClause += ' AND srv.VNO IN (SELECT VNO FROM tblsale_return sr JOIN tblproduct p ON sr.RemainID = p.AID WHERE p.CategoryID = ?)';
      params.push(brandId);
    }

    const cacheKey = `${CACHE_PREFIX.RETURN}:list:${page}:${limit}:${search}:${fromDate}:${toDate}:${customerId}:${brandId}:${branchId || 'all'}`;

    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return res.json({ success: true, ...cachedData, fromCache: true });
    }

    // Count total records
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM tblsale_return_voucher srv WHERE ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // Get return sales list
    const [rows] = await pool.query(
      `SELECT 
        srv.AID as id,
        srv.VNO as vno,
        srv.CustomerID as customerId,
        c.Name as customerName,
        srv.Reason as reason,
        srv.OriginalTotal as originalTotal,
        srv.RefundTotal as refundTotal,
        srv.Date as date,
        srv.UserID as userId,
        u.UserName as cashier,
        COALESCE(SUM(sr.ReturnQty), 0) as totalQty,
        COALESCE(SUM(sr.refundSubtotal), 0) as subTotal,
        srv.BranchID as branchId,
        b.BranchName as branchName
       FROM tblsale_return_voucher srv
       LEFT JOIN tblcustomer c ON srv.CustomerID = c.AID
       LEFT JOIN tbluser u ON srv.UserID = u.AID
       LEFT JOIN tblsale_return sr ON srv.VNO = sr.VNO
       LEFT JOIN tblbranch b ON srv.BranchID = b.AID
       WHERE ${whereClause}
       GROUP BY srv.AID, srv.VNO, srv.CustomerID, c.Name, srv.Reason, srv.OriginalTotal, srv.RefundTotal, srv.Date, srv.UserID, u.UserName
       ORDER BY srv.Date DESC, srv.VNO DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    // Calculate totals
    const [totalsResult] = await pool.query(
      `SELECT 
        COALESCE(SUM(sr.refundSubtotal), 0) as totalSubTotal,
        0 as totalDiscount,
        0 as totalTax,
        COALESCE(SUM(srv.RefundTotal), 0) as totalAmount,
        0 as totalCash,
        COALESCE(SUM(srv.RefundTotal), 0) as totalRefund
       FROM tblsale_return_voucher srv
       LEFT JOIN tblsale_return sr ON srv.VNO = sr.VNO
       WHERE ${whereClause}`,
      params
    );

    // Format response to match frontend expectations
    const formattedRows = rows.map(row => ({
      id: row.id,
      vno: row.vno,
      customerId: row.customerId,
      customerName: row.customerName || '-',
      totalQty: row.totalQty,
      subTotal: row.subTotal,
      discount: 0,
      tax: 0,
      total: row.refundTotal,
      userId: row.userId,
      cashier: row.cashier || '-',
      cash: 0,
      refund: row.refundTotal,
      date: row.date,
      paymentType: 'Return',
      reason: row.reason,
      originalTotal: row.originalTotal,
      branchId: row.branchId,
      branchName: row.branchName
    }));

    const result = {
      data: formattedRows,
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

    await cache.set(cacheKey, result, 120);

    res.json({ success: true, ...result, fromCache: false });
  } catch (error) {
    console.error('getReturnSales error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch return sales' });
  }
};

// Process sale return
const processSaleReturn = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { vno, items, reason, refundTotal } = req.body;
    const userId = req.user?.id || req.body.userId; // Get from auth or body

    if (!vno || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'VNO and items are required'
      });
    }

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Reason for return is required'
      });
    }

    await connection.beginTransaction();

    // Get original voucher details
    const [originalVoucher] = await connection.query(
      `SELECT * FROM tblvoucher WHERE VNO = ?`,
      [vno]
    );

    if (originalVoucher.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Original voucher not found'
      });
    }

    const originalVoucherData = originalVoucher[0];

    // Get original sale items with remainId and RegisterKey (IMEI)
    const [originalSaleItems] = await connection.query(
      `SELECT AID, AID as id, RemainID, ItemName, Qty, SellPrice, CodeNo, RegisterKey FROM tblsale WHERE VNO = ? ORDER BY AID`,
      [vno]
    );

    // Create a map of sale item ID to sale item data (handle both string and number IDs)
    const saleItemMap = new Map();
    originalSaleItems.forEach(item => {
      const idStr = String(item.AID);
      const idNum = Number(item.AID);
      // Store with both string and number keys to handle type mismatches
      saleItemMap.set(idStr, item);
      saleItemMap.set(idNum, item);
      saleItemMap.set(item.AID, item);
    });

    // Use the original VNO for return (don't generate new one)
    const returnVNO = vno;

    const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');

    // Process each return item
    for (const returnItem of items) {
      // Try multiple ways to find the item (handle type mismatches)
      let saleItem = saleItemMap.get(returnItem.id) ||
        saleItemMap.get(String(returnItem.id)) ||
        saleItemMap.get(Number(returnItem.id));

      // If still not found, try to find by matching in array
      if (!saleItem) {
        saleItem = originalSaleItems.find(item =>
          String(item.AID) === String(returnItem.id) ||
          Number(item.AID) === Number(returnItem.id)
        );
      }

      if (!saleItem) {
        await connection.rollback();
        const availableIds = originalSaleItems.map(item => item.AID);
        console.error('Sale item not found:', {
          vno: vno,
          returnItemId: returnItem.id,
          returnItemIdType: typeof returnItem.id,
          returnItem: returnItem,
          availableIds: availableIds,
          availableItems: originalSaleItems.map(item => ({ AID: item.AID, ItemName: item.ItemName, CodeNo: item.CodeNo }))
        });
        return res.status(400).json({
          success: false,
          message: `Sale item with ID "${returnItem.id}" not found in voucher ${vno}. Available item IDs: ${availableIds.join(', ')}`
        });
      }

      // Insert into tblsale_return
      await connection.query(
        `INSERT INTO tblsale_return (VNO, RemainID, Price, OldQty, ReturnQty, refundSubtotal, Date, BranchID)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          returnVNO,
          saleItem.RemainID,
          saleItem.SellPrice,
          saleItem.Qty,
          returnItem.returnQty,
          returnItem.refundAmount,
          currentDate,
          req.user.branchId
        ]
      );

      // Update tblproduct: StockQty = StockQty + ReturnQty
      await connection.query(
        `UPDATE tblproduct SET StockQty = StockQty + ? WHERE AID = ?`,
        [returnItem.returnQty, saleItem.RemainID]
      );

      // If it's a serialized item (has IMEI), restore its status to available (status=0)
      if (saleItem.RegisterKey) {
        await connection.query(
          `UPDATE tblpurchase_items SET status = 0 WHERE product_id = ? AND imei_1 = ?`,
          [saleItem.RemainID, saleItem.RegisterKey]
        );
      }
    }

    // Insert into tblsale_return_voucher
    await connection.query(
      `INSERT INTO tblsale_return_voucher (VNO, CustomerID, Reason, OriginalTotal, RefundTotal, Date, UserID, BranchID)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        returnVNO,
        originalVoucherData.CustomerID,
        reason,
        originalVoucherData.Total,
        refundTotal,
        currentDate,
        userId,
        req.user.branchId
      ]
    );

    // Update original tblvoucher: update refund amount
    // Keep Chk as it is (Cash/Credit) so it doesn't disappear from original lists
    // Note: Per user request, we are NOT updating tblvoucher anymore.
    // Refund is calculated on the fly in the query.
    /*
    await connection.query(
      `UPDATE tblvoucher SET Refund = ? WHERE VNO = ?`,
      [refundTotal, vno]
    );
    */

    await connection.commit();

    // Clear caches
    await cache.delPattern(`${CACHE_PREFIX.RETURN}:*`);
    await cache.delPattern(`voucher_detail:*`);
    await cache.delPattern(`inventory:*`);
    await cache.delPattern(`pos:*`);
    await cache.delPattern(`financial:*`);

    // Log return creation
    try {
      const clientIP = getClientIP(req);
      const username = req.body?.username || '';
      await logModel.create({
        description: `Processed return VNO ${vno} - refund ${refundTotal}`,
        userId: userId || null,
        ipAddress: clientIP
      });
    } catch (logErr) {
      console.error('log return create error:', logErr);
    }

    // Get return voucher details for response (use pool after commit)
    // Use the original VNO since we're using the same VNO for return
    const [returnVoucherRows] = await pool.query(
      `SELECT 
        v.AID as id,
        v.VNO as vno,
        v.CustomerID as customerId,
        c.Name as customerName,
        c.PhoneNo as customerPhone,
        c.Address as customerAddress,
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
        v.Chk as paymentType
       FROM tblvoucher v
       LEFT JOIN tblcustomer c ON v.CustomerID = c.AID
       LEFT JOIN tbluser u ON v.UserID = u.AID
       WHERE v.VNO = ?`,
      [vno]
    );

    const [returnSaleRows] = await pool.query(
      `SELECT 
        sr.AID as id,
        COALESCE(r.Name, s.ItemName) as itemName,
        sr.ReturnQty as qty,
        sr.Price as sellPrice,
        (sr.ReturnQty * sr.Price) as amount,
        sr.Date as date,
        sr.VNO as vno,
        v.CustomerID as customerId,
        sr.RemainID as remainId,
        r.CodeNo as codeNo
       FROM tblsale_return sr
       LEFT JOIN tblproduct r ON sr.RemainID = r.AID
       LEFT JOIN tblsale s ON sr.VNO = s.VNO AND sr.RemainID = s.RemainID
       LEFT JOIN tblvoucher v ON sr.VNO = v.VNO
       WHERE sr.VNO = ?
       ORDER BY sr.AID`,
      [vno]
    );

    res.status(201).json({
      success: true,
      message: 'Return processed successfully',
      data: {
        voucher: returnVoucherRows[0],
        items: returnSaleRows
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('processSaleReturn error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process return: ' + error.message
    });
  } finally {
    connection.release();
  }
};

// ============ SHARED FUNCTIONS ============

// Get voucher details by VNO (handles both regular and return vouchers)
const getVoucherDetails = async (req, res) => {
  try {
    const { vno } = req.params;

    const { userType, branchId } = req.user;
    const cacheKey = `voucher_detail:${vno}:${branchId || 'all'}`;

    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return res.json({ success: true, data: cachedData, fromCache: true });
    }

    const { type } = req.query;

    // If it's a return voucher request, fetch using the specialized return model method
    if (type === 'return') {
      const voucher = await voucherModel.findReturnVoucherByVNO(vno, { userType, branchId });
      
      if (!voucher) {
        return res.status(404).json({ success: false, message: 'Return voucher not found' });
      }

      // Get return items
      const [returnSaleRows] = await pool.query(
        `SELECT 
          sr.AID as id,
          COALESCE(r.Name, s.ItemName) as itemName,
          sr.ReturnQty as qty,
          sr.Price as sellPrice,
          sr.refundSubtotal as amount,
          sr.Date as date,
          sr.VNO as vno,
          srv.CustomerID as customerId,
          sr.RemainID as remainId,
          r.CodeNo as codeNo
         FROM tblsale_return sr
         LEFT JOIN tblproduct r ON sr.RemainID = r.AID
         LEFT JOIN tblsale s ON sr.VNO = s.VNO AND sr.RemainID = s.RemainID
         LEFT JOIN tblsale_return_voucher srv ON sr.VNO = srv.VNO
         WHERE sr.VNO = ?
         ORDER BY sr.AID`,
        [vno]
      );

      const result = {
        voucher: voucher,
        items: returnSaleRows
      };

      await cache.set(cacheKey, result, 300);

      return res.json({ success: true, data: result, fromCache: false });
    }

    // Regular voucher - get using the centralized model
    const voucher = await voucherModel.findByVNO(vno, { userType, branchId });

    if (!voucher) {
      return res.status(404).json({ success: false, message: 'Voucher not found' });
    }

    // Get sale items
    const [saleRows] = await pool.query(
      `SELECT 
        s.AID as id,
        s.ItemName as itemName,
        s.Qty as qty,
        s.SellPrice as sellPrice,
        (s.Qty * s.SellPrice) as amount,
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

    await cache.set(cacheKey, result, 300);

    res.json({ success: true, data: result, fromCache: false });
  } catch (error) {
    console.error('getVoucherDetails error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch voucher details' });
  }
};

// Delete sale by VNO - handles both regular sales and return sales
const deleteSaleByVNO = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { vno } = req.params;
    const { userId = null, username = '' } = req.body || {};
    const clientIP = getClientIP(req);

    await connection.beginTransaction();

    // Check if it's a return sale
    const [returnVoucherCheck] = await connection.query(
      `SELECT VNO, BranchID FROM tblsale_return_voucher WHERE VNO = ?`,
      [vno]
    );

    const { userType, branchId } = req.user;

    if (returnVoucherCheck.length > 0) {
      if (userType !== 'admin' && branchId && returnVoucherCheck[0].BranchID && returnVoucherCheck[0].BranchID != branchId) {
        await connection.rollback();
        return res.status(403).json({ success: false, message: 'Access denied: Return voucher belongs to another branch' });
      }
      // It's a return sale - delete from tblsale_return and tblsale_return_voucher

      // Get return items to restore inventory (subtract ReturnQty from tblremain)
      const [returnItems] = await connection.query(
        `SELECT RemainID, ReturnQty FROM tblsale_return WHERE VNO = ?`,
        [vno]
      );

      // Update tblproduct: StockQty = StockQty - ReturnQty (subtract the returned quantity to undo the return)
      for (const item of returnItems) {
        await connection.query(
          `UPDATE tblproduct SET StockQty = StockQty - ? WHERE AID = ?`,
          [item.ReturnQty, item.RemainID]
        );
      }

      // Delete from tblsale_return
      await connection.query(`DELETE FROM tblsale_return WHERE VNO = ?`, [vno]);

      // Delete from tblsale_return_voucher
      await connection.query(`DELETE FROM tblsale_return_voucher WHERE VNO = ?`, [vno]);

      // Update tblvoucher: Chk = 'Cash' (revert back to Cash)
      await connection.query(
        `UPDATE tblvoucher SET Chk = 'Cash' WHERE VNO = ?`,
        [vno]
      );

      await connection.commit();

      // Clear all sale caches
      await cache.delPattern(`${CACHE_PREFIX.CASH}:*`);
      await cache.delPattern(`${CACHE_PREFIX.CREDIT}:*`);
      await cache.delPattern(`${CACHE_PREFIX.RETURN}:*`);
      await cache.delPattern(`voucher_detail:*`);
      await cache.delPattern(`inventory:*`);
      await cache.delPattern(`financial:*`);

      // Log return delete
      try {
        await logModel.create({
          description: `Deleted return sale VNO ${vno} by ${username || 'Unknown'}`,
          userId: userId || null,
          ipAddress: clientIP
        });
      } catch (logErr) {
        console.error('log return delete error:', logErr);
      }

      return res.json({ success: true, message: 'Return deleted successfully and inventory restored' });
    }

    // Regular sale - existing logic
    // Get sale items to restore qty and IMEI status
    const [saleItems] = await connection.query(
      `SELECT s.RemainID, s.CodeNo, s.Qty, s.RegisterKey, v.BranchID 
       FROM tblsale s 
       JOIN tblvoucher v ON s.VNO = v.VNO 
       WHERE s.VNO = ?`,
      [vno]
    );

    if (saleItems.length > 0) {
      if (userType !== 'admin' && branchId && saleItems[0].BranchID && saleItems[0].BranchID != branchId) {
        await connection.rollback();
        return res.status(403).json({ success: false, message: 'Access denied: Sale belongs to another branch' });
      }
    }

    if (saleItems.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }

    // Restore qty to tblproduct and IMEI status to tblpurchase_items
    for (const item of saleItems) {
      await connection.query(
        `UPDATE tblproduct SET StockQty = StockQty + ? WHERE CodeNo = ?`,
        [item.Qty, item.CodeNo]
      );

      // If it's a serialized item, mark it as available again
      if (item.RegisterKey) {
        await connection.query(
          `UPDATE tblpurchase_items SET status = 0 WHERE product_id = ? AND imei_1 = ?`,
          [item.RemainID, item.RegisterKey]
        );
      }
    }

    // Delete from tblsale
    await connection.query(`DELETE FROM tblsale WHERE VNO = ?`, [vno]);

    // Delete from tblvoucher
    await connection.query(`DELETE FROM tblvoucher WHERE VNO = ?`, [vno]);

    // Delete credit details if any
    await connection.query(`DELETE FROM tblcreditdetail WHERE VNO = ?`, [vno]);

    await connection.commit();

    // Clear all sale caches
    await cache.delPattern(`${CACHE_PREFIX.CASH}:*`);
    await cache.delPattern(`${CACHE_PREFIX.CREDIT}:*`);
    await cache.delPattern(`${CACHE_PREFIX.RETURN}:*`);
    await cache.delPattern(`voucher_detail:*`);
    await cache.delPattern(`inventory:*`);
    await cache.delPattern(`financial:*`);

    // Log regular sale delete
    try {
      await logModel.create({
        description: `Deleted sale VNO ${vno} by ${username || 'Unknown'}`,
        userId: userId || null,
        ipAddress: clientIP
      });
    } catch (logErr) {
      console.error('log sale delete error:', logErr);
    }

    res.json({ success: true, message: 'Sale deleted successfully and inventory restored' });
  } catch (error) {
    await connection.rollback();
    console.error('deleteSaleByVNO error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete sale' });
  } finally {
    connection.release();
  }
};

// Get customers for dropdown
const getCustomersDropdown = async (req, res) => {
  try {
    const cacheKey = 'customers_dropdown';

    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return res.json({ success: true, data: cachedData, fromCache: true });
    }

    const [rows] = await pool.query(
      `SELECT AID as id, Name as name FROM tblcustomer ORDER BY Name`
    );

    await cache.set(cacheKey, rows, 300);

    res.json({ success: true, data: rows, fromCache: false });
  } catch (error) {
    console.error('getCustomersDropdown error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch customers' });
  }
};

// ============ CUSTOMER PAY VIEW ============

// Get credit payments grouped by VNO
const getCustomerPayments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const fromDate = req.query.fromDate || '';
    const toDate = req.query.toDate || '';
    const customerId = req.query.customerId || '';

    const offset = (page - 1) * limit;

    const { userType, branchId } = req.user;
    let whereClause = '1=1';
    let params = [];

    if (userType !== 'admin' && branchId) {
      whereClause += ' AND cd.BranchID = ?';
      params.push(branchId);
    }

    if (search) {
      whereClause += ' AND (cd.VNO LIKE ? OR c.Name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (customerId) {
      whereClause += ' AND cd.CustomerID = ?';
      params.push(customerId);
    }

    if (fromDate) {
      whereClause += ' AND DATE(cd.Date) >= ?';
      params.push(fromDate);
    }

    if (toDate) {
      whereClause += ' AND DATE(cd.Date) <= ?';
      params.push(toDate);
    }

    const cacheKey = `customer_payments:list:${page}:${limit}:${search}:${fromDate}:${toDate}:${customerId}:${branchId || 'all'}`;

    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return res.json({ success: true, ...cachedData, fromCache: true });
    }

    // Get total count of unique VNOs
    const [countResult] = await pool.query(
      `SELECT COUNT(DISTINCT cd.VNO) as total 
       FROM tblcreditdetail cd
       LEFT JOIN tblcustomer c ON cd.CustomerID = c.AID
       WHERE ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // Get grouped data by VNO
    const [rows] = await pool.query(
      `SELECT 
        cd.VNO as vno,
        cd.CustomerID as customerId,
        c.Name as customerName,
        SUM(cd.Amt) as totalPaid,
        COUNT(cd.AID) as paymentCount,
        MAX(cd.Date) as lastPaymentDate,
        MIN(cd.Date) as firstPaymentDate,
        v.Total as voucherTotal,
        v.Credit as remainingCredit,
        b.BranchName as branchName
       FROM tblcreditdetail cd
       LEFT JOIN tblcustomer c ON cd.CustomerID = c.AID
       LEFT JOIN tblvoucher v ON cd.VNO = v.VNO
       LEFT JOIN tblbranch b ON cd.BranchID = b.AID
       WHERE ${whereClause}
       GROUP BY cd.VNO, cd.CustomerID, c.Name, v.Total, v.Credit, b.BranchName
       ORDER BY MAX(cd.Date) DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    // Calculate totals
    const [totalsResult] = await pool.query(
      `SELECT 
        COALESCE(SUM(cd.Amt), 0) as grandTotalPaid
       FROM tblcreditdetail cd
       LEFT JOIN tblcustomer c ON cd.CustomerID = c.AID
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

    await cache.set(cacheKey, result, 120);

    res.json({ success: true, ...result, fromCache: false });
  } catch (error) {
    console.error('getCustomerPayments error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch customer payments' });
  }
};

// Get payment details by VNO
const getPaymentDetailsByVNO = async (req, res) => {
  try {
    const { vno } = req.params;

    const { userType, branchId } = req.user;
    const cacheKey = `customer_payments:detail:${vno}:${branchId || 'all'}`;

    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return res.json({ success: true, data: cachedData, fromCache: true });
    }

    // Get voucher info
    const [voucherRows] = await pool.query(
      `SELECT 
        v.VNO as vno,
        v.CustomerID as customerId,
        c.Name as customerName,
        c.PhoneNo as customerPhone,
        v.Total as voucherTotal,
        v.Credit as remainingCredit,
        v.Date as voucherDate,
        v.BranchID
       FROM tblvoucher v
       LEFT JOIN tblcustomer c ON v.CustomerID = c.AID
       WHERE v.VNO = ?`,
      [vno]
    );

    if (voucherRows.length > 0) {
      if (userType !== 'admin' && branchId && voucherRows[0].BranchID && voucherRows[0].BranchID != branchId) {
        return res.status(403).json({ success: false, message: 'Access denied: Voucher belongs to another branch' });
      }
    }

    // Get payment details
    const [paymentRows] = await pool.query(
      `SELECT 
        cd.AID as id,
        cd.VNO as vno,
        cd.CustomerID as customerId,
        cd.Amt as amount,
        cd.Date as date,
        cd.UserID as userId,
        cd.PaymentMethod as paymentMethod,
        u.UserName as userName
       FROM tblcreditdetail cd
       LEFT JOIN tbluser u ON cd.UserID = u.AID
       WHERE cd.VNO = ?
       ORDER BY cd.Date DESC`,
      [vno]
    );

    // Calculate total paid
    const totalPaid = paymentRows.reduce((sum, p) => sum + parseFloat(p.amount), 0);

    const result = {
      voucher: voucherRows[0] || null,
      payments: paymentRows,
      totalPaid
    };

    await cache.set(cacheKey, result, 300);

    res.json({ success: true, data: result, fromCache: false });
  } catch (error) {
    console.error('getPaymentDetailsByVNO error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch payment details' });
  }
};

// Delete a single credit payment (Cash -= amt, Credit += amt)
const deleteCreditPayment = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;

    await connection.beginTransaction();

    // Get the payment details first
    const [payment] = await connection.query(
      `SELECT VNO, Amt, BranchID FROM tblcreditdetail WHERE AID = ?`,
      [id]
    );

    const { userType, branchId } = req.user;
    if (payment.length > 0) {
      if (userType !== 'admin' && branchId && payment[0].BranchID && payment[0].BranchID != branchId) {
        await connection.rollback();
        return res.status(403).json({ success: false, message: 'Access denied: Payment belongs to another branch' });
      }
    }

    if (payment.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    const { VNO, Amt } = payment[0];

    // Delete the payment
    await connection.query(`DELETE FROM tblcreditdetail WHERE AID = ?`, [id]);

    // Update tblvoucher: Cash -= amt, Credit += amt (reverse the payment)
    await connection.query(
      `UPDATE tblvoucher SET Cash = Cash - ?, Credit = Credit + ? WHERE VNO = ?`,
      [Amt, Amt, VNO]
    );

    await connection.commit();

    // Clear cache
    await cache.delPattern(`customer_payments:*`);
    await cache.delPattern(`${CACHE_PREFIX.CREDIT}:*`);
    await cache.delPattern(`voucher_detail:*`);
    await cache.delPattern(`financial:*`);

    // Log credit payment delete
    try {
      const { userId = null, username = '' } = req.body || {};
      const clientIP = getClientIP(req);
      await logModel.create({
        description: `Deleted credit payment ID ${id} for VNO ${VNO} by ${username || 'Unknown'}`,
        userId: userId || null,
        ipAddress: clientIP
      });
    } catch (logErr) {
      console.error('log credit payment delete error:', logErr);
    }

    res.json({ success: true, message: 'Payment deleted successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('deleteCreditPayment error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete payment' });
  } finally {
    connection.release();
  }
};

// Get vouchers for dropdown (for returns)
const getVouchersDropdown = async (req, res) => {
  try {
    const { userType, branchId } = req.user;
    const search = req.query.search || '';
    let query = `SELECT VNO as id, VNO as name FROM tblvoucher WHERE Chk IN ('Cash', 'Credit')`;
    let params = [];

    if (userType !== 'admin' && branchId) {
      query += ` AND BranchID = ?`;
      params.push(branchId);
    }

    if (search) {
      query += ` AND VNO LIKE ?`;
      params.push(`%${search}%`);
    }
    query += ` ORDER BY Date DESC LIMIT 50`;
    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('getVouchersDropdown error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch vouchers' });
  }
};

// Get sales by salesperson/user
const getSalespersonReport = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const fromDate = req.query.fromDate || '';
    const toDate = req.query.toDate || '';
    const targetUserId = req.query.userId || '';
    const paymentType = req.query.paymentType || ''; // 'Cash', 'Credit', 'all'

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

    if (targetUserId && targetUserId !== 'all') {
      whereClause += ' AND v.UserID = ?';
      params.push(targetUserId);
    }

    if (paymentType && paymentType !== 'all') {
      whereClause += ' AND v.Chk = ?';
      params.push(paymentType);
    }

    if (fromDate) {
      whereClause += ' AND DATE(v.Date) >= ?';
      params.push(fromDate);
    }

    if (toDate) {
      whereClause += ' AND DATE(v.Date) <= ?';
      params.push(toDate);
    }

    const cacheKey = `${CACHE_PREFIX.CASH}:salesperson:${page}:${limit}:${search}:${fromDate}:${toDate}:${targetUserId}:${paymentType}:${branchId || 'all'}`;

    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return res.json({ success: true, ...cachedData, fromCache: true });
    }

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM tblvoucher v WHERE ${whereClause}`,
      params
    );
    const total = countResult[0].total;

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
        v.OtherAmt as otherAmt,
        v.Total as total,
        v.UserID as userId,
        u.UserName as cashier,
        v.Cash as cash,
        v.Refund as refund,
        (SELECT COUNT(*) FROM tblsale_return_voucher WHERE VNO = v.VNO) as returnCount,
        v.Date as date,
        v.Chk as paymentType,
        v.BranchID as branchId,
        b.BranchName as branchName,
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

    const [totalsResult] = await pool.query(
      `SELECT 
        COALESCE(SUM(v.TotalAmt), 0) as totalSubTotal,
        COALESCE(SUM(v.Dis), 0) as totalDiscount,
        COALESCE(SUM(v.Tax), 0) as totalTax,
        COALESCE(SUM(v.OtherAmt), 0) as totalOther,
        COALESCE(SUM(v.Total), 0) as totalAmount,
        COALESCE(SUM(v.Cash), 0) as totalCash,
        COALESCE(SUM(v.Refund), 0) as totalRefund,
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

    await cache.set(cacheKey, result, 120);

    res.json({ success: true, ...result, fromCache: false });
  } catch (error) {
    console.error('getSalespersonReport error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch salesperson sales' });
  }
};

module.exports = {
  getCashSales,
  getCreditSales,
  payCredit,
  getCreditHistory,
  getReturnSales,
  processSaleReturn,
  getVoucherDetails,
  deleteSaleByVNO,
  getCustomersDropdown,
  getVouchersDropdown,
  getCustomerPayments,
  getPaymentDetailsByVNO,
  deleteCreditPayment,
  getSalespersonReport
};

