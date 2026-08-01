const productModel = require('../models/product.model');
const { cache } = require('../config/redis');

const CACHE_PREFIX = 'products';

const getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    
    const cacheKey = `${CACHE_PREFIX}:list:${page}:${limit}:${search}`;
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return res.json({ success: true, ...cachedData, fromCache: true });
    }
    
    const result = await productModel.findAll({ page, limit, search });
    await cache.set(cacheKey, result, 300);
    
    res.json({ success: true, ...result, fromCache: false });
  } catch (error) {
    console.error('getProducts error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch products' });
  }
};

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = `${CACHE_PREFIX}:${id}`;
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return res.json({ success: true, data: cachedData, fromCache: true });
    }
    
    const product = await productModel.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    await cache.set(cacheKey, product, 300);
    res.json({ success: true, data: product, fromCache: false });
  } catch (error) {
    console.error('getProductById error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch product' });
  }
};

const createProduct = async (req, res) => {
  try {
    const product = await productModel.create(req.body);
    await cache.delPattern(`${CACHE_PREFIX}:list:*`);
    res.status(201).json({ success: true, message: 'Product created successfully', data: product });
  } catch (error) {
    console.error('createProduct error:', error);
    res.status(500).json({ success: false, message: 'Failed to create product' });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'];
    const branchId = req.headers['x-branch-id'];

    const product = await productModel.update(id, { 
      ...req.body, 
      userId, 
      branchId 
    });
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    await cache.del(`${CACHE_PREFIX}:${id}`);
    await cache.delPattern(`${CACHE_PREFIX}:list:*`);
    res.json({ success: true, message: 'Product updated successfully', data: product });
  } catch (error) {
    console.error('updateProduct error:', error);
    res.status(500).json({ success: false, message: 'Failed to update product' });
  }
};


const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await productModel.delete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    await cache.del(`${CACHE_PREFIX}:${id}`);
    await cache.delPattern(`${CACHE_PREFIX}:list:*`);
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('deleteProduct error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete product' });
  }
};

const bulkCreateProducts = async (req, res) => {
  try {
    const products = req.body;
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid products array' });
    }
    
    const result = await productModel.bulkCreate(products);
    await cache.delPattern(`${CACHE_PREFIX}:list:*`);
    res.status(201).json({ 
      success: true, 
      message: `Successfully processed ${products.length} products (Inserted: ${result.insertedCount}, Updated: ${result.updatedCount})`, 
      data: result 
    });
  } catch (error) {
    console.error('bulkCreateProducts error:', error);
    res.status(500).json({ success: false, message: 'Failed to bulk create products' });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkCreateProducts
};
