const express = require('express');
const router = express.Router();
const transferController = require('../controllers/transfer.controller');
// GET /api/transfers - List transfers
router.get('/', transferController.getTransfers);

// GET /api/transfers/incoming - List incoming transfers
router.get('/incoming', transferController.getIncomingTransfers);

// GET /api/transfers/:id - Get transfer details
router.get('/:id', transferController.getTransferById);

// POST /api/transfers - Create transfer
router.post('/', transferController.createTransfer);

// POST /api/transfers/:id/receive - Confirm receive
router.post('/:id/receive', transferController.receiveTransfer);

// DELETE /api/transfers/:id - Cancel transfer
router.delete('/:id', transferController.deleteTransfer);

module.exports = router;
