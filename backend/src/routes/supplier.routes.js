const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplier.controller');

// GET /api/suppliers - Get all suppliers with pagination
router.get('/', supplierController.getSuppliers);

// GET /api/suppliers/:id/transactions - Get supplier transaction summary
router.get('/:id/transactions', supplierController.getSupplierTransactions);

// GET /api/suppliers/:id/payments - Get supplier payments (with pagination and search)
router.get('/:id/payments', supplierController.getSupplierPayments);

// POST /api/suppliers/:id/payments - Create supplier payment
router.post('/:id/payments', supplierController.createSupplierPayment);

// PUT /api/suppliers/:id/payments/:paymentId - Update supplier payment
router.put('/:id/payments/:paymentId', supplierController.updateSupplierPayment);

// DELETE /api/suppliers/:id/payments/:paymentId - Delete supplier payment
router.delete('/:id/payments/:paymentId', supplierController.deleteSupplierPayment);

// GET /api/suppliers/:id/purchases - Get supplier purchases (with pagination and search)
router.get('/:id/purchases', supplierController.getSupplierPurchases);

// GET /api/suppliers/:id - Get single supplier
router.get('/:id', supplierController.getSupplierById);

// POST /api/suppliers - Create new supplier
router.post('/', supplierController.createSupplier);

// PUT /api/suppliers/:id - Update supplier
router.put('/:id', supplierController.updateSupplier);

// DELETE /api/suppliers/:id - Delete supplier
router.delete('/:id', supplierController.deleteSupplier);

module.exports = router;

