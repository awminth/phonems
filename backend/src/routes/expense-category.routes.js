const express = require('express');
const router = express.Router();
const expenseCategoryController = require('../controllers/expense-category.controller');

// GET /api/expense-categories - Get all expense categories with pagination
router.get('/', expenseCategoryController.getExpenseCategories);

// GET /api/expense-categories/dropdown - Get all for dropdown
router.get('/dropdown', expenseCategoryController.getExpenseCategoriesDropdown);

// GET /api/expense-categories/:id - Get single expense category
router.get('/:id', expenseCategoryController.getExpenseCategoryById);

// POST /api/expense-categories - Create new expense category
router.post('/', expenseCategoryController.createExpenseCategory);

// PUT /api/expense-categories/:id - Update expense category
router.put('/:id', expenseCategoryController.updateExpenseCategory);

// DELETE /api/expense-categories/:id - Delete expense category
router.delete('/:id', expenseCategoryController.deleteExpenseCategory);

module.exports = router;

