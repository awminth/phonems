const expenseCategoryModel = require('../models/expense-category.model');
const { cache } = require('../config/redis');

// Cache key prefix
const CACHE_PREFIX = 'expense_categories';

// Get all expense categories with pagination
const getExpenseCategories = async (req, res) => {
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
    const result = await expenseCategoryModel.findAll({ page, limit, search });
    
    // Store in cache for 5 minutes
    await cache.set(cacheKey, result, 300);
    
    res.json({
      success: true,
      ...result,
      fromCache: false
    });
  } catch (error) {
    console.error('getExpenseCategories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expense categories'
    });
  }
};

// Get all categories for dropdown (no pagination)
const getExpenseCategoriesDropdown = async (req, res) => {
  try {
    const cacheKey = `${CACHE_PREFIX}:dropdown`;
    
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        data: cachedData,
        fromCache: true
      });
    }
    
    const categories = await expenseCategoryModel.findAllForDropdown();
    
    await cache.set(cacheKey, categories, 600);
    
    res.json({
      success: true,
      data: categories,
      fromCache: false
    });
  } catch (error) {
    console.error('getExpenseCategoriesDropdown error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expense categories'
    });
  }
};

// Get single expense category by ID
const getExpenseCategoryById = async (req, res) => {
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
    
    const category = await expenseCategoryModel.findById(id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Expense category not found'
      });
    }
    
    await cache.set(cacheKey, category, 300);
    
    res.json({
      success: true,
      data: category,
      fromCache: false
    });
  } catch (error) {
    console.error('getExpenseCategoryById error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expense category'
    });
  }
};

// Create new expense category
const createExpenseCategory = async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }
    
    const newCategory = await expenseCategoryModel.create({ name: name.trim() });
    
    // Invalidate caches
    await cache.delPattern(`${CACHE_PREFIX}:*`);
    
    res.status(201).json({
      success: true,
      message: 'Expense category created successfully',
      data: newCategory
    });
  } catch (error) {
    console.error('createExpenseCategory error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create expense category'
    });
  }
};

// Update expense category
const updateExpenseCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }
    
    const updated = await expenseCategoryModel.update(id, { name: name.trim() });
    
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Expense category not found'
      });
    }
    
    // Invalidate caches
    await cache.del(`${CACHE_PREFIX}:${id}`);
    await cache.delPattern(`${CACHE_PREFIX}:list:*`);
    await cache.delPattern(`${CACHE_PREFIX}:dropdown`);
    
    res.json({
      success: true,
      message: 'Expense category updated successfully',
      data: updated
    });
  } catch (error) {
    console.error('updateExpenseCategory error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update expense category'
    });
  }
};

// Delete expense category
const deleteExpenseCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deleted = await expenseCategoryModel.delete(id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Expense category not found'
      });
    }
    
    // Invalidate caches
    await cache.del(`${CACHE_PREFIX}:${id}`);
    await cache.delPattern(`${CACHE_PREFIX}:list:*`);
    await cache.delPattern(`${CACHE_PREFIX}:dropdown`);
    
    res.json({
      success: true,
      message: 'Expense category deleted successfully'
    });
  } catch (error) {
    console.error('deleteExpenseCategory error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete expense category'
    });
  }
};

module.exports = {
  getExpenseCategories,
  getExpenseCategoriesDropdown,
  getExpenseCategoryById,
  createExpenseCategory,
  updateExpenseCategory,
  deleteExpenseCategory
};

