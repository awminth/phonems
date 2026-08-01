const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expense.controller');

// GET /api/expenses - Get all expenses with pagination and filters
router.get('/', expenseController.getExpenses);

// GET /api/expenses/total - Get total expenses
router.get('/total', expenseController.getTotalExpenses);

// GET /api/expenses/:id - Get single expense
router.get('/:id', expenseController.getExpenseById);

// POST /api/expenses - Create new expense
router.post('/', expenseController.createExpense);

// PUT /api/expenses/:id - Update expense
router.put('/:id', expenseController.updateExpense);

// DELETE /api/expenses/:id - Delete expense
router.delete('/:id', expenseController.deleteExpense);

module.exports = router;

