const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customer.controller');

// GET /api/customers - Get all customers with pagination
router.get('/', customerController.getCustomers);

// GET /api/customers/dropdown - Get all customers for dropdown
router.get('/dropdown', customerController.getCustomersDropdown);

// GET /api/customers/:id - Get single customer
router.get('/:id', customerController.getCustomerById);

// POST /api/customers - Create new customer
router.post('/', customerController.createCustomer);

// PUT /api/customers/:id - Update customer
router.put('/:id', customerController.updateCustomer);

// DELETE /api/customers/:id - Delete customer
router.delete('/:id', customerController.deleteCustomer);

module.exports = router;

