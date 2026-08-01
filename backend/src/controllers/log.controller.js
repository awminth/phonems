const logModel = require('../models/log.model');
const { cache } = require('../config/redis');

// Cache key prefix
const CACHE_PREFIX = 'logs';

// Get all logs with pagination
const getLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const userId = req.query.userId || null;
    
    const { userType, branchId } = req.user;
    
    // Generate cache key
    const cacheKey = `${CACHE_PREFIX}:list:${page}:${limit}:${search}:${userId || 'all'}:${branchId || 'all'}`;
    
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
    const result = await logModel.findAll({ page, limit, search, userId, userType, branchId });
    
    // Store in cache for 1 minute (logs change frequently)
    await cache.set(cacheKey, result, 60);
    
    res.json({
      success: true,
      ...result,
      fromCache: false
    });
  } catch (error) {
    console.error('getLogs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch logs'
    });
  }
};

// Get logs by user ID
const getLogsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    
    const { userType, branchId: requesterBranchId } = req.user;
    const result = await logModel.findByUserId({ userId, page, limit, search, userType, branchId: requesterBranchId });
    
    res.json({
      success: true,
      ...result,
      fromCache: false
    });
  } catch (error) {
    console.error('getLogsByUserId error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user logs'
    });
  }
};

// Create log entry (for manual logging from frontend if needed)
const createLog = async (req, res) => {
  try {
    const { description, userId } = req.body;
    
    if (!description || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Description and userId are required'
      });
    }
    
    const branchId = req.user?.branchId || null;
    const logId = await logModel.create({ description, userId, branchId });
    
    // Invalidate cache
    await cache.delPattern(`${CACHE_PREFIX}:*`);
    
    res.status(201).json({
      success: true,
      message: 'Log created successfully',
      data: { id: logId }
    });
  } catch (error) {
    console.error('createLog error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create log'
    });
  }
};

module.exports = {
  getLogs,
  getLogsByUserId,
  createLog
};

