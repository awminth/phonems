const express = require('express');
const router = express.Router();
const {
  getCashSales,
  getCreditSales,
  payCredit,
  getCreditHistory,
  getReturnSales,
  processSaleReturn,
  getVoucherDetails,
  deleteSaleByVNO,
  getCustomersDropdown,
  getVouchersDropdown,
  getCustomerPayments,
  getPaymentDetailsByVNO,
  deleteCreditPayment,
  getSalespersonReport
} = require('../controllers/sale-list.controller');

// Salesperson Report
router.get('/salesperson-report', getSalespersonReport);

// Vouchers dropdown (for returns)
router.get('/vouchers/dropdown', getVouchersDropdown);

// Customers dropdown
router.get('/customers/dropdown', getCustomersDropdown);

// Cash Sales
router.get('/cash', getCashSales);

// Credit Sales
router.get('/credit', getCreditSales);
router.post('/credit/pay', payCredit);
router.get('/credit/history/:vno', getCreditHistory);

// Return Sales
router.get('/return', getReturnSales);
router.post('/return', processSaleReturn);

// Customer Pay View
router.get('/customer-payments', getCustomerPayments);
router.get('/customer-payments/:vno', getPaymentDetailsByVNO);
router.delete('/customer-payments/payment/:id', deleteCreditPayment);

// Shared - Voucher details
router.get('/voucher/:vno', getVoucherDetails);

// Shared - Delete sale
router.delete('/voucher/:vno', deleteSaleByVNO);

module.exports = router;

