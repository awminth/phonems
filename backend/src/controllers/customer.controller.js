const customerModel = require('../models/customer.model');
const { cache } = require('../config/redis');

// Cache key prefix
const CACHE_PREFIX = 'customers';

// Clear customer cache
const clearCustomerCache = async () => {
  await cache.delPattern(`${CACHE_PREFIX}:*`);
};

// Get all customers with pagination
const getCustomers = async (req, res) => {
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
    const { userType, branchId } = req.user;
    const result = await customerModel.findAll({ page, limit, search, userType, branchId });
    
    // Store in cache for 3 minutes
    await cache.set(cacheKey, result, 180);
    
    res.json({
      success: true,
      ...result,
      fromCache: false
    });
  } catch (error) {
    console.error('getCustomers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customers'
    });
  }
};

// Get customers for dropdown
const getCustomersDropdown = async (req, res) => {
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
    
    const { userType, branchId } = req.user;
    const customers = await customerModel.findAllForDropdown({ userType, branchId });
    
    await cache.set(cacheKey, customers, 300);
    
    res.json({
      success: true,
      data: customers,
      fromCache: false
    });
  } catch (error) {
    console.error('getCustomersDropdown error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customers'
    });
  }
};

// Get single customer by ID
const getCustomerById = async (req, res) => {
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
    
    const { userType, branchId } = req.user;
    const customer = await customerModel.findById(id, { userType, branchId });
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    await cache.set(cacheKey, customer, 300);
    
    res.json({
      success: true,
      data: customer,
      fromCache: false
    });
  } catch (error) {
    console.error('getCustomerById error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer'
    });
  }
};

// Create new customer
const createCustomer = async (req, res) => {
  try {
    const { name, phone, address, email } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Customer name is required'
      });
    }
    
    const { branchId } = req.user;
    const newCustomer = await customerModel.create({
      name: name.trim(),
      phone: phone?.trim() || '',
      address: address?.trim() || '',
      email: email?.trim() || '',
      branchId
    });
    
    // Clear cache
    await clearCustomerCache();
    
    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: newCustomer
    });
  } catch (error) {
    console.error('createCustomer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create customer'
    });
  }
};

// Update customer
const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, address, email } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Customer name is required'
      });
    }
    
    const { userType, branchId } = req.user;
    const updated = await customerModel.update(id, {
      name: name.trim(),
      phone: phone?.trim() || '',
      address: address?.trim() || '',
      email: email?.trim() || '',
      userType,
      branchId
    });
    
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    // Clear cache
    await clearCustomerCache();
    
    res.json({
      success: true,
      message: 'Customer updated successfully',
      data: updated
    });
  } catch (error) {
    console.error('updateCustomer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update customer'
    });
  }
};

// Delete customer
const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    
    const { userType, branchId } = req.user;
    const deleted = await customerModel.delete(id, { userType, branchId });
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    // Clear cache
    await clearCustomerCache();
    
    res.json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    console.error('deleteCustomer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete customer'
    });
  }
};

module.exports = {
  getCustomers,
  getCustomersDropdown,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer
};

