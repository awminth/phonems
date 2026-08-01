const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');

// GET /api/categories - Get all categories with pagination
router.get('/', categoryController.getCategories);

// GET /api/categories/:id - Get single category
router.get('/:id', categoryController.getCategoryById);

// POST /api/categories - Create new category
router.post('/', categoryController.createCategory);

// PUT /api/categories/:id - Update category
router.put('/:id', categoryController.updateCategory);

// DELETE /api/categories/:id - Delete category
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;

