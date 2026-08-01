const purchaseReturnModel = require('../models/purchase-return.model');
const { cache } = require('../config/redis');

const CACHE_PREFIX = 'purchase_returns';

// Get purchase invoice details
const getPurchaseInvoiceDetails = async (req, res) => {
  try {
    const { purchaseInvoiceNo } = req.params;
    
    const cacheKey = `purchase_invoice:${purchaseInvoiceNo}`;
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        data: cachedData,
        fromCache: true
      });
    }

    const details = await purchaseReturnModel.getPurchaseInvoiceDetails(purchaseInvoiceNo);
    
    if (!details) {
      return res.status(404).json({
        success: false,
        message: 'Purchase invoice not found'
      });
    }

    await cache.set(cacheKey, details, 300);
    
    res.json({
      success: true,
      data: details,
      fromCache: false
    });
  } catch (error) {
    console.error('getPurchaseInvoiceDetails error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch purchase invoice details: ' + (error.message || 'Unknown error')
    });
  }
};

// Get all purchase returns
const getPurchaseReturns = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const fromDate = req.query.fromDate || '';
    const toDate = req.query.toDate || '';

    const cacheKey = `${CACHE_PREFIX}:list:${page}:${limit}:${search}:${fromDate}:${toDate}`;
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        ...cachedData,
        fromCache: true
      });
    }

    const result = await purchaseReturnModel.findAll({ page, limit, search, fromDate, toDate });
    
    await cache.set(cacheKey, result, 300);
    
    res.json({
      success: true,
      ...result,
      fromCache: false
    });
  } catch (error) {
    console.error('getPurchaseReturns error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch purchase returns'
    });
  }
};

// Get purchase return by ID
const getPurchaseReturnById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const cacheKey = `${CACHE_PREFIX}:${id}`;
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        data: cachedData,
        fromCache: true
      });
    }

    const result = await purchaseReturnModel.findById(id);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Purchase return not found'
      });
    }

    await cache.set(cacheKey, result, 300);
    
    res.json({
      success: true,
      data: result,
      fromCache: false
    });
  } catch (error) {
    console.error('getPurchaseReturnById error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch purchase return'
    });
  }
};

// Create purchase return
const createPurchaseReturn = async (req, res) => {
  try {
    const { purchaseInvoiceNo, supplierId, items, reason, refundTotal } = req.body;
    const userId = req.user?.id || req.body.userId;

    if (!purchaseInvoiceNo || !supplierId || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Purchase invoice number, supplier ID, and items are required'
      });
    }

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Reason is required'
      });
    }

    const id = await purchaseReturnModel.create({
      purchaseInvoiceNo,
      supplierId,
      items,
      reason,
      refundTotal,
      userId
    });

    // Clear caches
    await cache.delPattern(`${CACHE_PREFIX}:*`);
    await cache.delPattern('purchase_invoice:*');
    await cache.delPattern('inventory:*');
    await cache.delPattern('financial:*');

    res.status(201).json({
      success: true,
      message: 'Purchase return created successfully',
      data: { id }
    });
  } catch (error) {
    console.error('createPurchaseReturn error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create purchase return: ' + error.message
    });
  }
};

// Update purchase return
const updatePurchaseReturn = async (req, res) => {
  try {
    const { id } = req.params;
    const { purchaseInvoiceNo, supplierId, items, reason, refundTotal } = req.body;
    const userId = req.user?.id || req.body.userId;

    if (!purchaseInvoiceNo || !supplierId || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Purchase invoice number, supplier ID, and items are required'
      });
    }

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Reason is required'
      });
    }

    await purchaseReturnModel.update(id, {
      purchaseInvoiceNo,
      supplierId,
      items,
      reason,
      refundTotal,
      userId
    });

    // Clear caches
    await cache.delPattern(`${CACHE_PREFIX}:*`);
    await cache.delPattern('purchase_invoice:*');
    await cache.delPattern('inventory:*');
    await cache.delPattern('financial:*');

    res.json({
      success: true,
      message: 'Purchase return updated successfully'
    });
  } catch (error) {
    console.error('updatePurchaseReturn error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update purchase return: ' + error.message
    });
  }
};

// Delete purchase return
const deletePurchaseReturn = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await purchaseReturnModel.delete(id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Purchase return not found'
      });
    }

    // Clear caches
    await cache.delPattern(`${CACHE_PREFIX}:*`);
    await cache.delPattern('purchase_invoice:*');
    await cache.delPattern('inventory:*');
    await cache.delPattern('financial:*');

    res.json({
      success: true,
      message: 'Purchase return deleted successfully'
    });
  } catch (error) {
    console.error('deletePurchaseReturn error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete purchase return: ' + error.message
    });
  }
};

// Get purchase vouchers for dropdown
const getPurchaseVouchersDropdown = async (req, res) => {
  try {
    const { search } = req.query;
    const result = await purchaseReturnModel.getPurchaseVouchersDropdown(search);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('getPurchaseVouchersDropdown error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch purchase vouchers'
    });
  }
};

module.exports = {
  getPurchaseInvoiceDetails,
  getPurchaseReturns,
  getPurchaseReturnById,
  getPurchaseVouchersDropdown,
  createPurchaseReturn,
  updatePurchaseReturn,
  deletePurchaseReturn
};

