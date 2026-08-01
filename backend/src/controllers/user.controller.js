const userModel = require('../models/user.model');
const { cache } = require('../config/redis');

// Cache key prefix
const CACHE_PREFIX = 'users';

// Get all users with pagination
const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    
    const { userType, branchId } = req.user;

    if (userType === 'user') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Users do not have permission to view users'
      });
    }
    
    // Generate cache key
    const cacheKey = `${CACHE_PREFIX}:list:${page}:${limit}:${search}:${branchId || 'all'}`;
    
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
    const result = await userModel.findAll({ page, limit, search, userType, branchId });
    
    // Store in cache for 3 minutes
    await cache.set(cacheKey, result, 180);
    
    res.json({
      success: true,
      ...result,
      fromCache: false
    });
  } catch (error) {
    console.error('getUsers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
};

// Get single user by ID
const getUserById = async (req, res) => {
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
    
    const user = await userModel.findById(id);
    
    if (user) {
      const { userType, branchId } = req.user;
      if (userType !== 'admin' && branchId && user.branchId && user.branchId != branchId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: User belongs to another branch'
        });
      }
    }
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    await cache.set(cacheKey, user, 300);
    
    res.json({
      success: true,
      data: user,
      fromCache: false
    });
  } catch (error) {
    console.error('getUserById error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user'
    });
  }
};

// Create new user
const createUser = async (req, res) => {
  try {
    const { username, password, isActive, permissions, userType, branchId } = req.body;
    const { userType: requesterType, branchId: requesterBranchId } = req.user;

    if (requesterType === 'user') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Users do not have permission to manage users'
      });
    }

    if (requesterType === 'manager') {
      if (userType === 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Managers cannot create admin users'
        });
      }
      if (branchId != requesterBranchId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Managers can only create users for their own branch'
        });
      }
    }

    if (!username || username.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Username is required'
      });
    }
    
    if (!password || password.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Password is required'
      });
    }
    
    // Check if username already exists
    const exists = await userModel.usernameExists(username.trim());
    if (exists) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }
    
    const newUser = await userModel.create({
      username: username.trim(),
      password: password, // In production, hash the password!
      isActive: isActive !== false,
      permissions: permissions || [],
      userType: userType || 'user',
      branchId: branchId || null
    });
    
    // Invalidate caches
    await cache.delPattern(`${CACHE_PREFIX}:list:*`);
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: newUser
    });
  } catch (error) {
    console.error('createUser error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user'
    });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, isActive, permissions, userType, branchId } = req.body;
    
    if (!username || username.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Username is required'
      });
    }
    
    // Check if username already exists (excluding current user)
    const exists = await userModel.usernameExists(username.trim(), id);
    if (exists) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }
    
    const { userType: requesterType, branchId: requesterBranchId } = req.user;

    if (requesterType === 'user') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Users do not have permission to manage users'
      });
    }

    // Check access
    const existingUser = await userModel.findById(id);
    if (existingUser && requesterType !== 'admin' && requesterBranchId && existingUser.branchId && existingUser.branchId != requesterBranchId) {
       return res.status(403).json({
         success: false,
         message: 'Access denied: Cannot update user from another branch'
       });
    }

    if (requesterType === 'manager') {
      if (userType === 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Managers cannot promote users to admin'
        });
      }
      if (branchId != requesterBranchId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Managers cannot change user branch'
        });
      }
    }

    const updated = await userModel.update(id, {
      username: username.trim(),
      password: password || null, // In production, hash the password!
      isActive: isActive !== false,
      permissions: permissions || [],
      userType: userType || 'user',
      branchId: branchId || null
    });
    
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Invalidate caches
    await cache.del(`${CACHE_PREFIX}:${id}`);
    await cache.delPattern(`${CACHE_PREFIX}:list:*`);
    
    res.json({
      success: true,
      message: 'User updated successfully',
      data: updated
    });
  } catch (error) {
    console.error('updateUser error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user'
    });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const { userType: requesterType, branchId: requesterBranchId } = req.user;

    if (requesterType === 'user') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Users do not have permission to manage users'
      });
    }

    const existingUser = await userModel.findById(id);
    
    if (existingUser && requesterType !== 'admin' && requesterBranchId && existingUser.branchId && existingUser.branchId != requesterBranchId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Cannot delete user from another branch'
      });
    }

    if (existingUser && existingUser.userType === 'admin' && requesterType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Non-admin users cannot delete admin users'
      });
    }

    const deleted = await userModel.delete(id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Invalidate caches
    await cache.del(`${CACHE_PREFIX}:${id}`);
    await cache.delPattern(`${CACHE_PREFIX}:list:*`);
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('deleteUser error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};

