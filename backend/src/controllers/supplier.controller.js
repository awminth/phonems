const supplierModel = require('../models/supplier.model');
const { cache } = require('../config/redis');

// Cache key prefix
const CACHE_PREFIX = 'suppliers';

// Get all suppliers with pagination
const getSuppliers = async (req, res) => {
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
    const result = await supplierModel.findAll({ page, limit, search });
    
    // Store in cache
    await cache.set(cacheKey, result, 300); // Cache for 5 minutes
    
    res.json({
      success: true,
      ...result,
      fromCache: false
    });
  } catch (error) {
    console.error('getSuppliers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch suppliers'
    });
  }
};

// Get single supplier by ID
const getSupplierById = async (req, res) => {
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
    
    const supplier = await supplierModel.findById(id);
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }
    
    // Store in cache
    await cache.set(cacheKey, supplier, 300);
    
    res.json({
      success: true,
      data: supplier,
      fromCache: false
    });
  } catch (error) {
    console.error('getSupplierById error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch supplier'
    });
  }
};

// Create new supplier
const createSupplier = async (req, res) => {
  try {
    const { name, address, email, phone } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Supplier name is required'
      });
    }
    
    const newSupplier = await supplierModel.create({ 
      name: name.trim(),
      address: address?.trim() || '',
      email: email?.trim() || '',
      phone: phone?.trim() || ''
    });
    
    // Invalidate list cache
    await cache.delPattern(`${CACHE_PREFIX}:list:*`);
    
    res.status(201).json({
      success: true,
      message: 'Supplier created successfully',
      data: newSupplier
    });
  } catch (error) {
    console.error('createSupplier error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create supplier'
    });
  }
};

// Update supplier
const updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, email, phone } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Supplier name is required'
      });
    }
    
    const updated = await supplierModel.update(id, { 
      name: name.trim(),
      address: address?.trim() || '',
      email: email?.trim() || '',
      phone: phone?.trim() || ''
    });
    
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }
    
    // Invalidate caches
    await cache.del(`${CACHE_PREFIX}:${id}`);
    await cache.delPattern(`${CACHE_PREFIX}:list:*`);
    
    res.json({
      success: true,
      message: 'Supplier updated successfully',
      data: updated
    });
  } catch (error) {
    console.error('updateSupplier error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update supplier'
    });
  }
};

// Delete supplier
const deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deleted = await supplierModel.delete(id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }
    
    // Invalidate caches
    await cache.del(`${CACHE_PREFIX}:${id}`);
    await cache.delPattern(`${CACHE_PREFIX}:list:*`);
    
    res.json({
      success: true,
      message: 'Supplier deleted successfully'
    });
  } catch (error) {
    console.error('deleteSupplier error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete supplier'
    });
  }
};

// Get supplier transaction summary
const getSupplierTransactions = async (req, res) => {
  try {
    const { id } = req.params;
    
    const summary = await supplierModel.getTransactionSummary(id);
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('getSupplierTransactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch supplier transactions'
    });
  }
};

// Get supplier payments with pagination and search
const getSupplierPayments = async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const fromDate = req.query.fromDate || '';
    const toDate = req.query.toDate || '';
    const vno = req.query.vno || '';
    
    // Generate cache key
    const cacheKey = `${CACHE_PREFIX}:payments:${id}:${page}:${limit}:${fromDate}:${toDate}:${vno}`;
    
    // Try to get from cache
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        ...cachedData,
        fromCache: true
      });
    }
    
    const result = await supplierModel.getPayments({
      supplierId: id,
      page,
      limit,
      fromDate,
      toDate,
      vno
    });
    
    // Store in cache
    await cache.set(cacheKey, result, 300); // Cache for 5 minutes
    
    res.json({
      success: true,
      ...result,
      fromCache: false
    });
  } catch (error) {
    console.error('getSupplierPayments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch supplier payments'
    });
  }
};

// Create supplier payment
const createSupplierPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, date, userId, vno, remark } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount is required and must be greater than 0'
      });
    }
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required'
      });
    }
    
    const payment = await supplierModel.createPayment({
      supplierId: id,
      amount: parseFloat(amount),
      date,
      userId,
      vno,
      remark
    });
    
    // Invalidate caches
    await cache.delPattern(`${CACHE_PREFIX}:payments:${id}:*`);
    await cache.delPattern(`${CACHE_PREFIX}:transactions:${id}*`);
    
    res.status(201).json({
      success: true,
      message: 'Payment created successfully',
      data: payment
    });
  } catch (error) {
    console.error('createSupplierPayment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment'
    });
  }
};

// Update supplier payment
const updateSupplierPayment = async (req, res) => {
  try {
    const { id, paymentId } = req.params;
    const { amount, date, userId, vno, remark } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount is required and must be greater than 0'
      });
    }
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required'
      });
    }
    
    const payment = await supplierModel.updatePayment(paymentId, {
      amount: parseFloat(amount),
      date,
      userId,
      vno,
      remark
    });
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }
    
    // Invalidate caches
    await cache.delPattern(`${CACHE_PREFIX}:payments:${id}:*`);
    await cache.delPattern(`${CACHE_PREFIX}:transactions:${id}*`);
    
    res.json({
      success: true,
      message: 'Payment updated successfully',
      data: payment
    });
  } catch (error) {
    console.error('updateSupplierPayment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update payment'
    });
  }
};

// Delete supplier payment
const deleteSupplierPayment = async (req, res) => {
  try {
    const { id, paymentId } = req.params;
    
    const deleted = await supplierModel.deletePayment(paymentId);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }
    
    // Invalidate caches
    await cache.delPattern(`${CACHE_PREFIX}:payments:${id}:*`);
    await cache.delPattern(`${CACHE_PREFIX}:transactions:${id}*`);
    
    res.json({
      success: true,
      message: 'Payment deleted successfully'
    });
  } catch (error) {
    console.error('deleteSupplierPayment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete payment'
    });
  }
};

// Get supplier purchases with pagination and search
const getSupplierPurchases = async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const fromDate = req.query.fromDate || '';
    const toDate = req.query.toDate || '';
    
    // Generate cache key
    const cacheKey = `${CACHE_PREFIX}:purchases:${id}:${page}:${limit}:${fromDate}:${toDate}`;
    
    // Try to get from cache
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        ...cachedData,
        fromCache: true
      });
    }
    
    const result = await supplierModel.getPurchases({
      supplierId: id,
      page,
      limit,
      fromDate,
      toDate
    });
    
    // Store in cache
    await cache.set(cacheKey, result, 300); // Cache for 5 minutes
    
    res.json({
      success: true,
      ...result,
      fromCache: false
    });
  } catch (error) {
    console.error('getSupplierPurchases error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch supplier purchases'
    });
  }
};

module.exports = {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getSupplierTransactions,
  getSupplierPayments,
  createSupplierPayment,
  updateSupplierPayment,
  deleteSupplierPayment,
  getSupplierPurchases
};

