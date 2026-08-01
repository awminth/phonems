const purchaseModel = require('../models/purchase.model');
const { cache } = require('../config/redis');
const { uploadPurchaseImage, deleteOldImage, getImagePath } = require('../config/upload');

// Cache key prefix
const CACHE_PREFIX = 'purchases';

// Get all purchases with pagination
const getPurchases = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const code = req.query.code || '';
    const name = req.query.name || '';
    const categoryId = req.query.categoryId || '';
    const supplierId = req.query.supplierId || '';
    const date = req.query.date || '';
    const fromDate = req.query.fromDate || '';
    const toDate = req.query.toDate || '';
    const type = req.query.type || 'all';
    
    // Generate cache key
    const cacheKey = `${CACHE_PREFIX}:list:${page}:${limit}:${search}:${code}:${name}:${categoryId}:${supplierId}:${date}:${fromDate}:${toDate}:${type}`;
    
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
    const { userType, branchId } = req.user;
    const result = await purchaseModel.findAll({ 
      page, 
      limit, 
      search, 
      code, 
      name, 
      categoryId, 
      supplierId, 
      date, 
      fromDate,
      toDate,
      type,
      userType, 
      branchId 
    });
    
    // Store in cache
    await cache.set(cacheKey, result, 300); // Cache for 5 minutes
    
    res.json({
      success: true,
      ...result,
      fromCache: false
    });
  } catch (error) {
    console.error('getPurchases error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch purchases'
    });
  }
};

// Get single purchase by ID
const getPurchaseById = async (req, res) => {
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
    
    const purchase = await purchaseModel.findById(id);
    
    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found'
      });
    }
    
    // Store in cache
    await cache.set(cacheKey, purchase, 300);
    
    res.json({
      success: true,
      data: purchase,
      fromCache: false
    });
  } catch (error) {
    console.error('getPurchaseById error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch purchase'
    });
  }
};

// Create new purchase with file upload
const createPurchase = async (req, res) => {
  uploadPurchaseImage(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload failed'
      });
    }
    
    try {
      const { code, name, qty, purchasePrice, sellPrice, categoryId, supplierId, date } = req.body;
      
      if (!code || code.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Code is required'
        });
      }
      
      if (!name || name.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Item name is required'
        });
      }
      
      if (!qty || qty <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Quantity must be greater than 0'
        });
      }
      
      // Get image path if file was uploaded
      const imagePath = req.file ? getImagePath(req.file.filename) : null;
      
      const newPurchase = await purchaseModel.create({
        code: code.trim(),
        name: name.trim(),
        qty: parseInt(qty),
        purchasePrice: parseFloat(purchasePrice) || 0,
        sellPrice: parseFloat(sellPrice) || 0,
        categoryId: categoryId || null,
        supplierId: supplierId || null,
        date: date || new Date().toISOString().split('T')[0],
        image: imagePath,
        branchId: req.user.branchId
      });
      
      // Invalidate caches
      await cache.delPattern(`${CACHE_PREFIX}:list:*`);
      await cache.delPattern('inventory:*');
      
      res.status(201).json({
        success: true,
        message: 'Purchase created successfully',
        data: newPurchase
      });
    } catch (error) {
      console.error('createPurchase error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create purchase'
      });
    }
  });
};

// Update purchase with file upload
const updatePurchase = async (req, res) => {
  uploadPurchaseImage(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload failed'
      });
    }
    
    try {
      const { id } = req.params;
      const { code, name, qty, purchasePrice, sellPrice, categoryId, supplierId, date } = req.body;
      
      if (!code || code.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Code is required'
        });
      }
      
      if (!name || name.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Item name is required'
        });
      }
      
      if (!qty || qty <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Quantity must be greater than 0'
        });
      }
      
      // Get old purchase to check for old image
      const { userType, branchId } = req.user;
      const oldPurchase = await purchaseModel.findById(id, { userType, branchId });
      if (!oldPurchase) {
        return res.status(404).json({
          success: false,
          message: 'Purchase not found'
        });
      }
      
      // Get new image path if file was uploaded, otherwise keep old
      let imagePath = oldPurchase.image;
      if (req.file) {
        // Delete old image if exists
        if (oldPurchase.image) {
          deleteOldImage(oldPurchase.image);
        }
        imagePath = getImagePath(req.file.filename);
      }
      
      const updated = await purchaseModel.update(id, {
        code: code.trim(),
        name: name.trim(),
        qty: parseInt(qty),
        purchasePrice: parseFloat(purchasePrice) || 0,
        sellPrice: parseFloat(sellPrice) || 0,
        categoryId: categoryId || null,
        supplierId: supplierId || null,
        date: date || new Date().toISOString().split('T')[0],
        image: imagePath,
        userType,
        branchId
      });
      
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Purchase not found'
        });
      }
      
      // Invalidate caches
      await cache.del(`${CACHE_PREFIX}:${id}`);
      await cache.delPattern(`${CACHE_PREFIX}:list:*`);
      await cache.delPattern('inventory:*');
      
      res.json({
        success: true,
        message: 'Purchase updated successfully',
        data: updated
      });
    } catch (error) {
      console.error('updatePurchase error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update purchase'
      });
    }
  });
};

// Delete purchase
const deletePurchase = async (req, res) => {
  try {
    const { id } = req.params;
    
    const { userType, branchId } = req.user;
    const purchase = await purchaseModel.findById(id, { userType, branchId });
    
    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found'
      });
    }

    const deleted = await purchaseModel.delete(id, { userType, branchId });
    
    if (!deleted) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete purchase'
      });
    }
    
    // Delete image file if exists
    if (purchase.image) {
      deleteOldImage(purchase.image);
    }
    
    // Invalidate caches
    await cache.del(`${CACHE_PREFIX}:${id}`);
    await cache.delPattern(`${CACHE_PREFIX}:list:*`);
    await cache.delPattern('inventory:*');
    
    res.json({
      success: true,
      message: 'Purchase deleted successfully'
    });
  } catch (error) {
    console.error('deletePurchase error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete purchase'
    });
  }
};

// Get dropdown options (categories and suppliers)
const getDropdownOptions = async (req, res) => {
  try {
    const cacheKey = 'dropdowns:purchase';
    
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        ...cachedData,
        fromCache: true
      });
    }
    
    const [categories, suppliers, products] = await Promise.all([
      purchaseModel.getCategories(),
      purchaseModel.getSuppliers(),
      purchaseModel.getProducts()
    ]);
    
    const data = { categories, suppliers, products };
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

module.exports = {
  getPurchases,
  getPurchaseById,
  createPurchase,
  updatePurchase,
  deletePurchase,
  getDropdownOptions
};
