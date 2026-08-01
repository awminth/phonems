const categoryModel = require('../models/category.model');
const { cache } = require('../config/redis');

// Cache key prefix
const CACHE_PREFIX = 'categories';

// Get all categories with pagination
const getCategories = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    
    // Generate cache key
    const cacheKey = `${CACHE_PREFIX}:list:${page}:${limit}:${search}`;
    
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
    const result = await categoryModel.findAll({ page, limit, search });
    
    // Store in cache
    await cache.set(cacheKey, result, 300); // Cache for 5 minutes
    
    res.json({
      success: true,
      ...result,
      fromCache: false
    });
  } catch (error) {
    console.error('getCategories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories'
    });
  }
};

// Get single category by ID
const getCategoryById = async (req, res) => {
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
    
    const category = await categoryModel.findById(id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    // Store in cache
    await cache.set(cacheKey, category, 300);
    
    res.json({
      success: true,
      data: category,
      fromCache: false
    });
  } catch (error) {
    console.error('getCategoryById error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category'
    });
  }
};

// Create new category
const createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }
    
    const newCategory = await categoryModel.create({ name: name.trim() });
    
    // Invalidate list cache
    await cache.delPattern(`${CACHE_PREFIX}:list:*`);
    
    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: newCategory
    });
  } catch (error) {
    console.error('createCategory error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create category'
    });
  }
};

// Update category
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }
    
    const updated = await categoryModel.update(id, { name: name.trim() });
    
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    // Invalidate caches
    await cache.del(`${CACHE_PREFIX}:${id}`);
    await cache.delPattern(`${CACHE_PREFIX}:list:*`);
    
    res.json({
      success: true,
      message: 'Category updated successfully',
      data: updated
    });
  } catch (error) {
    console.error('updateCategory error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update category'
    });
  }
};

// Delete category
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deleted = await categoryModel.delete(id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    // Invalidate caches
    await cache.del(`${CACHE_PREFIX}:${id}`);
    await cache.delPattern(`${CACHE_PREFIX}:list:*`);
    
    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('deleteCategory error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete category'
    });
  }
};

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
};

