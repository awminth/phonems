const purchaseVoucherModel = require('../models/purchase-voucher.model');
const { cache } = require('../config/redis');
const { uploadPurchaseImage, getImagePath } = require('../config/upload');

const CACHE_PREFIX = 'purchase_vouchers';

// Upload image for purchase voucher item
const uploadItemImage = async (req, res) => {
  uploadPurchaseImage(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload failed'
      });
    }

    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No image file provided'
        });
      }

      const imagePath = getImagePath(req.file.filename);

      res.json({
        success: true,
        message: 'Image uploaded successfully',
        data: {
          imagePath: imagePath,
          filename: req.file.filename
        }
      });
    } catch (error) {
      console.error('uploadItemImage error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload image: ' + error.message
      });
    }
  });
};

// Get all purchase vouchers
const getPurchaseVouchers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const fromDate = req.query.fromDate || '';
    const toDate = req.query.toDate || '';

    const { userType, branchId } = req.user;
    const cacheKey = `${CACHE_PREFIX}:list:${page}:${limit}:${search}:${fromDate}:${toDate}:${branchId || 'all'}`;
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        ...cachedData,
        fromCache: true
      });
    }

    const result = await purchaseVoucherModel.findAll({ page, limit, search, fromDate, toDate, userType, branchId });
    
    await cache.set(cacheKey, result, 300);
    
    res.json({
      success: true,
      ...result,
      fromCache: false
    });
  } catch (error) {
    console.error('getPurchaseVouchers error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error code:', error.code);
    console.error('Error sqlMessage:', error.sqlMessage);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch purchase vouchers: ' + (error.sqlMessage || error.message || 'Unknown error'),
      errorCode: error.code,
      sqlMessage: error.sqlMessage
    });
  }
};

// Get purchase voucher by ID
const getPurchaseVoucherById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const { userType, branchId } = req.user;
    const cacheKey = `${CACHE_PREFIX}:${id}:${branchId || 'all'}`;
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        data: cachedData,
        fromCache: true
      });
    }

    const result = await purchaseVoucherModel.findById(id, { userType, branchId });
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Purchase voucher not found'
      });
    }

    await cache.set(cacheKey, result, 300);
    
    res.json({
      success: true,
      data: result,
      fromCache: false
    });
  } catch (error) {
    console.error('getPurchaseVoucherById error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch purchase voucher'
    });
  }
};

// Get next VNO
const getNextVNO = async (req, res) => {
  try {
    const vno = await purchaseVoucherModel.getNextVNO();
    res.json({
      success: true,
      data: { vno }
    });
  } catch (error) {
    console.error('getNextVNO error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate VNO'
    });
  }
};

// Create purchase voucher
const createPurchaseVoucher = async (req, res) => {
  try {
    let { 
      vno, supplierId, items, 
      taxAmount = 0, discount = 0, paidAmount = 0, 
      totalAmount = 0, netAmount = 0, balanceAmount = 0, status = 'Paid' 
    } = req.body;
    const userId = req.user?.id || req.body.userId;

    // Parse items if it's a string (from FormData)
    if (typeof items === 'string') {
      items = JSON.parse(items);
    }

    if (!vno || !supplierId || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'VNO, supplier ID, and items are required'
      });
    }

    const id = await purchaseVoucherModel.create({
      vno,
      supplierId,
      items,
      userId,
      taxAmount,
      discount,
      paidAmount,
      totalAmount,
      netAmount,
      balanceAmount,
      status,
      branchId: req.user.branchId
    });

    // Clear caches
    await cache.delPattern(`${CACHE_PREFIX}:*`);
    await cache.delPattern('purchases:*');
    await cache.delPattern('inventory:*');
    await cache.delPattern('financial:*');

    res.status(201).json({
      success: true,
      message: 'Purchase voucher created successfully',
      data: { id }
    });
  } catch (error) {
    console.error('createPurchaseVoucher error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create purchase voucher: ' + error.message
    });
  }
};

// Update purchase voucher
const updatePurchaseVoucher = async (req, res) => {
  try {
    const { id } = req.params;
    let { 
      supplierId, items, taxAmount = 0, discount = 0, 
      paidAmount = 0, totalAmount = 0, netAmount = 0, 
      balanceAmount = 0, status = 'Paid' 
    } = req.body;
    const userId = req.user?.id || req.body.userId;

    // Parse items if it's a string (from FormData)
    if (typeof items === 'string') {
      items = JSON.parse(items);
    }

    if (!supplierId || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Supplier ID and items are required'
      });
    }

    const result = await purchaseVoucherModel.update(id, {
      supplierId,
      items,
      userId,
      taxAmount,
      discount,
      paidAmount,
      totalAmount,
      netAmount,
      balanceAmount,
      status,
      userType: req.user.userType,
      branchId: req.user.branchId
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Purchase voucher not found'
      });
    }

    // Clear caches
    await cache.delPattern(`${CACHE_PREFIX}:*`);
    await cache.delPattern('purchases:*');
    await cache.delPattern('inventory:*');
    await cache.delPattern('financial:*');

    res.json({
      success: true,
      message: 'Purchase voucher updated successfully',
      data: { id: result }
    });
  } catch (error) {
    console.error('updatePurchaseVoucher error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update purchase voucher: ' + error.message
    });
  }
};

// Delete purchase voucher
const deletePurchaseVoucher = async (req, res) => {
  try {
    const { id } = req.params;

    const { userType, branchId } = req.user;
    const result = await purchaseVoucherModel.delete(id, { userType, branchId });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Purchase voucher not found'
      });
    }

    // Clear caches
    await cache.delPattern(`${CACHE_PREFIX}:*`);
    await cache.delPattern('purchases:*');
    await cache.delPattern('inventory:*');
    await cache.delPattern('financial:*');

    res.json({
      success: true,
      message: 'Purchase voucher deleted successfully'
    });
  } catch (error) {
    console.error('deletePurchaseVoucher error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete purchase voucher: ' + error.message
    });
  }
};

module.exports = {
  uploadItemImage,
  getPurchaseVouchers,
  getPurchaseVoucherById,
  getNextVNO,
  createPurchaseVoucher,
  updatePurchaseVoucher,
  deletePurchaseVoucher
};
