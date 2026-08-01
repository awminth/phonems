const saleModel = require('../models/sale.model');
const voucherModel = require('../models/voucher.model');
const logModel = require('../models/log.model');
const { cache } = require('../config/redis');

// Cache key prefix
const CACHE_PREFIX = 'pos';

// Clear POS cache
const clearPOSCache = async () => {
  await cache.delPattern(`${CACHE_PREFIX}:*`);
  await cache.delPattern('inventory:*');
  await cache.delPattern('financial:*');
  await cache.delPattern('cash_sale:*');
  await cache.delPattern('credit_sale:*');
  await cache.delPattern('return_sale:*');
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

// Process checkout (Cash or Credit)
const processCheckout = async (req, res) => {
  const connection = await require('../config/database').pool.getConnection();

  try {
    const {
      items,
      vno,
      customerId,
      totalQty,
      subtotal,
      discount,
      tax,
      total,
      cash,
      refund,
      credit,
      paymentType, // 'Cash' or 'Credit'
      userId,
      date
    } = req.body;

    // Validate
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No items to checkout'
      });
    }

    if (!vno) {
      return res.status(400).json({
        success: false,
        message: 'Voucher number is required'
      });
    }

    // Check if VNO already exists
    // Check if VNO already exists
    const vnoExists = await voucherModel.vnoExists(vno);
    if (vnoExists) {
      return res.status(400).json({
        success: false,
        message: 'Voucher number already exists'
      });
    }

    await connection.beginTransaction();

    // 1. Insert sale records
    let currentDate;
    if (date) {
      if (date.includes('T') || date.includes(' ')) {
        currentDate = new Date(date).toISOString().slice(0, 19).replace('T', ' ');
      } else {
        const now = new Date();
        const timeStr = now.toISOString().slice(11, 19);
        currentDate = `${date} ${timeStr}`;
      }
    } else {
      currentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
    }

    for (const item of items) {
      // Detect if it's a service (RemainID is a string like 'service-...' or item.isService is true)
      // We use NULL for RemainID in tblsale because the column is an integer
      const isService = (typeof item.remainId === 'string' && item.remainId.includes('service')) || item.isService === true || item.isService === 1;
      const remainIdToSave = isService ? null : item.remainId;

      // 1. Insert sale record
      await connection.query(
        `INSERT INTO tblsale (RemainID, ItemName, Qty, SellPrice, Date, VNO, CustomerID, CodeNo, RegisterKey, BranchID) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [remainIdToSave, item.itemName, item.qty, item.sellPrice, currentDate, vno, customerId || null, item.codeNo, item.imei || null, req.user.branchId]
      );

      // 2. Update product stock and status (Only for actual products, skip for services)
      if (!isService) {
        await connection.query(
          `UPDATE tblproduct SET StockQty = StockQty - ? WHERE AID = ?`,
          [item.qty, item.remainId]
        );

        // If it's a serialized item, update its status in tblpurchase_items to mark as sold
        if (item.stockId) {
          await connection.query(
            `UPDATE tblpurchase_items SET status = 1 WHERE p_item_id = ?`,
            [item.stockId]
          );
        }
      }
    }

    // 2. Insert voucher record
    const voucherData = {
      vno,
      customerId: customerId || null,
      totalQty,
      totalAmt: subtotal,
      dis: discount || 0,
      tax: tax || 0,
      otherAmt: req.body.otherAmt || 0,
      otherType: req.body.otherType || 'percent',
      otherValue: req.body.otherValue || 0,
      total,
      cash: paymentType === 'Cash' || paymentType === 'KPay' || paymentType === 'WavePay' ? cash : 0,
      refund: paymentType === 'Cash' || paymentType === 'KPay' || paymentType === 'WavePay' ? refund : 0,
      credit: paymentType === 'Credit' ? total : 0,
      chk: paymentType === 'Credit' ? 'Credit' : 'Cash', 
      paymentMethod: paymentType, // Pass the specific method (Cash, KPay, WavePay, Credit)
      userId,
      date: currentDate
    };

    await connection.query(
      `INSERT INTO tblvoucher (VNO, CustomerID, TotalQty, TotalAmt, Dis, Tax, OtherAmt, OtherType, OtherValue, Total, Cash, Refund, Credit, Chk, PaymentMethod, UserID, Date, BranchID) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        voucherData.vno,
        voucherData.customerId,
        voucherData.totalQty,
        voucherData.totalAmt,
        voucherData.dis,
        voucherData.tax,
        voucherData.otherAmt,
        voucherData.otherType,
        voucherData.otherValue,
        voucherData.total,
        voucherData.cash,
        voucherData.refund,
        voucherData.credit,
        voucherData.chk,
        voucherData.paymentMethod,
        voucherData.userId,
        voucherData.date,
        req.user.branchId
      ]
    );

    await connection.commit();

    // Clear cache
    await clearPOSCache();

    // Log checkout event
    const clientIP = getClientIP(req);
    try {
      await logModel.create({
        description: `POS checkout VNO ${vno} (${paymentType}) - Total ${total}`,
        userId: userId || null,
        ipAddress: clientIP
      });
    } catch (logError) {
      // Do not block checkout response on log failure
      console.error('POS checkout log error:', logError);
    }

    // Get voucher details for response
    const { userType, branchId } = req.user;
    const voucher = await voucherModel.findByVNO(vno, { userType, branchId });
    const saleItems = await saleModel.findByVNO(vno, { userType, branchId });

    // Get next VNO
    const nextVNO = await voucherModel.getNextVNO();

    res.status(201).json({
      success: true,
      message: 'Checkout successful',
      data: {
        voucher,
        items: saleItems,
        nextVNO
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('processCheckout error:', error);
    res.status(500).json({
      success: false,
      message: 'Checkout failed: ' + error.message
    });
  } finally {
    connection.release();
  }
};

// Get voucher details
const getVoucherDetails = async (req, res) => {
  try {
    const { vno } = req.params;

    const { userType, branchId } = req.user;
    const voucher = await voucherModel.findByVNO(vno, { userType, branchId });
    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Voucher not found'
      });
    }

    const items = await saleModel.findByVNO(vno, { userType, branchId });

    res.json({
      success: true,
      data: {
        voucher,
        items
      }
    });
  } catch (error) {
    console.error('getVoucherDetails error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get voucher details'
    });
  }
};

// Get vouchers list
const getVouchers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const fromDate = req.query.fromDate || '';
    const toDate = req.query.toDate || '';
    const customerId = req.query.customerId || '';

    const { userType, branchId } = req.user;
    const result = await voucherModel.findAll({
      page, limit, search, fromDate, toDate, customerId, userType, branchId
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('getVouchers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get vouchers'
    });
  }
};

// Get next VNO
const getNextVNO = async (req, res) => {
  try {
    const nextVNO = await voucherModel.getNextVNO();
    res.json({
      success: true,
      data: { vno: nextVNO }
    });
  } catch (error) {
    console.error('getNextVNO error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate VNO'
    });
  }
};

module.exports = {
  processCheckout,
  getVoucherDetails,
  getVouchers,
  getNextVNO
};

