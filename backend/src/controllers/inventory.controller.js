const inventoryModel = require('../models/inventory.model');
const { cache } = require('../config/redis');

// Cache key prefix
const CACHE_PREFIX = 'inventory';

// Get all inventory items with pagination and filters
const getInventory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const categoryId = req.query.categoryId || '';
    const supplierId = req.query.supplierId || '';
    const underQty = req.query.underQty || '';
    const isSerialized = req.query.isSerialized !== undefined ? req.query.isSerialized : '';
    const isService = req.query.isService !== undefined ? req.query.isService : '';
    const isSparePart = req.query.isSparePart !== undefined ? req.query.isSparePart : '';
    
    // Generate cache key
    const { userType, branchId: userBranchId } = req.user;
    const queryBranchId = req.query.branchId;
    
    // Admin can view any branch, others are restricted to their own
    const branchId = (userType === 'admin') ? (queryBranchId || 'all') : userBranchId;

    const cacheKey = `${CACHE_PREFIX}:list:${page}:${limit}:${search}:${categoryId}:${supplierId}:${underQty}:${branchId}:${isSerialized}:${isService}:${isSparePart}`;
    
    // Try to get from cache
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        ...cachedData,
        fromCache: true
      });
    }
    
    // Get from database
    const result = await inventoryModel.findAll({ 
      page, 
      limit, 
      search, 
      categoryId, 
      supplierId, 
      underQty,
      userType,
      branchId: branchId === 'all' ? null : branchId,
      isSerialized,
      isService,
      isSparePart
    });
    
    // Store in cache for 3 minutes
    await cache.set(cacheKey, result, 180);
    
    res.json({
      success: true,
      ...result,
      fromCache: false
    });
  } catch (error) {
    console.error('getInventory error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory'
    });
  }
};

// Get single inventory item by ID
const getInventoryById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Try to get from cache
    const cacheKey = `${CACHE_PREFIX}:${id}`;
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        data: cachedData,
        fromCache: true
      });
    }
    
    const item = await inventoryModel.findById(id);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }
    
    // Store in cache
    await cache.set(cacheKey, item, 300);
    
    res.json({
      success: true,
      data: item,
      fromCache: false
    });
  } catch (error) {
    console.error('getInventoryById error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory item'
    });
  }
};

// Update inventory item (Qty and SellPrice only)
const updateInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const { qty, sellPrice } = req.body;
    
    // Validation
    if (qty === undefined || qty < 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a non-negative number'
      });
    }
    
    if (sellPrice === undefined || sellPrice < 0) {
      return res.status(400).json({
        success: false,
        message: 'Sell price must be a non-negative number'
      });
    }
    
    const { id: userId, branchId } = req.user;
    const updated = await inventoryModel.update(id, { 
      qty: parseInt(qty), 
      sellPrice: parseFloat(sellPrice),
      userId,
      branchId
    });
    
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }
    
    // Invalidate caches
    await cache.del(`${CACHE_PREFIX}:${id}`);
    await cache.delPattern(`${CACHE_PREFIX}:list:*`);
    
    res.json({
      success: true,
      message: 'Inventory updated successfully',
      data: updated
    });
  } catch (error) {
    console.error('updateInventory error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update inventory'
    });
  }
};

// Get dropdown options (categories and suppliers)
const getDropdownOptions = async (req, res) => {
  try {
    const cacheKey = 'dropdowns:inventory';
    
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        ...cachedData,
        fromCache: true
      });
    }
    
    const [categories, suppliers] = await Promise.all([
      inventoryModel.getCategories(),
      inventoryModel.getSuppliers()
    ]);
    
    const data = { categories, suppliers };
    await cache.set(cacheKey, data, 600); // Cache for 10 minutes
    
    res.json({
      success: true,
      ...data,
      fromCache: false
    });
  } catch (error) {
    console.error('getDropdownOptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dropdown options'
    });
  }
};

// Get low stock count
const getLowStockCount = async (req, res) => {
  try {
    const threshold = req.query.threshold === 'min' ? 'min' : (parseInt(req.query.threshold) || 5);
    
    const { userType, branchId } = req.user;
    const count = await inventoryModel.getLowStockCount(threshold, { userType, branchId });
    
    res.json({
      success: true,
      count,
      threshold
    });
  } catch (error) {
    console.error('getLowStockCount error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get low stock count'
    });
  }
};

// Get IMEIs by Product ID
const getInventoryImeis = async (req, res) => {
  try {
    const { id } = req.params;
    const { userType, branchId } = req.user;
    const imeis = await inventoryModel.getImeisByProductId(id, { userType, branchId });
    
    res.json({
      success: true,
      data: imeis
    });
  } catch (error) {
    console.error('getInventoryImeis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch IMEIs'
    });
  }
};

// Get purchase price history
const getPurchasePriceHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { userType, branchId } = req.user;
    const history = await inventoryModel.getPurchasePriceHistory(id, { userType, branchId });
    
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('getPurchasePriceHistory error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch price history'
    });
  }
};

const getSellingPriceHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const history = await inventoryModel.getSellingPriceHistory(id);
    
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('getSellingPriceHistory error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch selling price history'
    });
  }
};

const getAllSellingPriceHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { fromDate, toDate, search } = req.query;
    let { branchId } = req.query;

    // Security: Only admins can filter by any branch. Others are locked to their own branch.
    if (req.user.userType !== 'admin') {
      branchId = req.user.branchId;
    }

    const result = await inventoryModel.getAllSellingPriceHistory({
      page,
      limit,
      fromDate,
      toDate,
      branchId,
      search
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {

    console.error('getAllSellingPriceHistory error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch selling price history'
    });
  }
};


module.exports = {
  getInventory,
  getInventoryById,
  updateInventory,
  getDropdownOptions,
  getLowStockCount,
  getInventoryImeis,
  getPurchasePriceHistory,
  getSellingPriceHistory,
  getAllSellingPriceHistory
};


