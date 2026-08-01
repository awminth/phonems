const expenseModel = require('../models/expense.model');
const { cache } = require('../config/redis');

// Cache key prefix
const CACHE_PREFIX = 'expenses';

// Get all expenses with pagination and filters
const getExpenses = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const categoryId = req.query.categoryId || '';
    const fromDate = req.query.fromDate || '';
    const toDate = req.query.toDate || '';
    
    const { userType, branchId } = req.user;

    // Generate cache key
    const cacheKey = `${CACHE_PREFIX}:list:${page}:${limit}:${search}:${categoryId}:${fromDate}:${toDate}:${branchId || 'all'}`;
    
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
    const result = await expenseModel.findAll({ 
      page, 
      limit, 
      search, 
      categoryId, 
      fromDate, 
      toDate,
      userType,
      branchId
    });
    
    // Store in cache for 3 minutes
    await cache.set(cacheKey, result, 180);
    
    res.json({
      success: true,
      ...result,
      fromCache: false
    });
  } catch (error) {
    console.error('getExpenses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expenses'
    });
  }
};

// Get single expense by ID
const getExpenseById = async (req, res) => {
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
    
    const expense = await expenseModel.findById(id, { userType, branchId });
    
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }
    
    await cache.set(cacheKey, expense, 300);
    
    res.json({
      success: true,
      data: expense,
      fromCache: false
    });
  } catch (error) {
    console.error('getExpenseById error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expense'
    });
  }
};

// Create new expense
const createExpense = async (req, res) => {
  try {
    const { description, amount, date, categoryId } = req.body;
    
    if (!description || description.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Description is required'
      });
    }
    
    if (amount === undefined || amount < 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a non-negative number'
      });
    }
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required'
      });
    }
    
    const newExpense = await expenseModel.create({
      description: description.trim(),
      amount: parseFloat(amount),
      date,
      categoryId: categoryId || null,
      branchId: req.user.branchId
    });
    
    // Invalidate caches
    await cache.delPattern(`${CACHE_PREFIX}:list:*`);
    await cache.delPattern('financial:*');
    
    res.status(201).json({
      success: true,
      message: 'Expense created successfully',
      data: newExpense
    });
  } catch (error) {
    console.error('createExpense error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create expense'
    });
  }
};

// Update expense
const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { description, amount, date, categoryId } = req.body;
    
    if (!description || description.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Description is required'
      });
    }
    
    if (amount === undefined || amount < 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a non-negative number'
      });
    }
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required'
      });
    }
    
    const updated = await expenseModel.update(id, {
      description: description.trim(),
      amount: parseFloat(amount),
      date,
      categoryId: categoryId || null,
      userType: req.user.userType,
      branchId: req.user.branchId
    });
    
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }
    
    // Invalidate caches
    await cache.del(`${CACHE_PREFIX}:${id}`);
    await cache.delPattern(`${CACHE_PREFIX}:list:*`);
    await cache.delPattern('financial:*');
    
    res.json({
      success: true,
      message: 'Expense updated successfully',
      data: updated
    });
  } catch (error) {
    console.error('updateExpense error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update expense'
    });
  }
};

// Delete expense
const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    
    const { userType, branchId } = req.user;
    const deleted = await expenseModel.delete(id, { userType, branchId });
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }
    
    // Invalidate caches
    await cache.del(`${CACHE_PREFIX}:${id}`);
    await cache.delPattern(`${CACHE_PREFIX}:list:*`);
    await cache.delPattern('financial:*');
    
    res.json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    console.error('deleteExpense error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete expense'
    });
  }
};

// Get total expenses
const getTotalExpenses = async (req, res) => {
  try {
    const fromDate = req.query.fromDate || '';
    const toDate = req.query.toDate || '';
    
    const { userType, branchId } = req.user;
    const total = await expenseModel.getTotalByDateRange(fromDate, toDate, { userType, branchId });
    
    res.json({
      success: true,
      total,
      fromDate,
      toDate
    });
  } catch (error) {
    console.error('getTotalExpenses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get total expenses'
    });
  }
};

module.exports = {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  getTotalExpenses
};
