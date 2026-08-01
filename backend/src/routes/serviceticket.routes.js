const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/serviceticket.controller');

// GET /api/servicetickets - Get all service tickets
router.get('/', ticketController.getTickets);

// GET /api/servicetickets/:id - Get service ticket by ID
router.get('/:id', ticketController.getTicketById);

// POST /api/servicetickets - Create a new service ticket
router.post('/', ticketController.createTicket);

// PUT /api/servicetickets/:id - Update a service ticket
router.put('/:id', ticketController.updateTicket);

// PATCH /api/servicetickets/:id/status - Quick update status
router.patch('/:id/status', ticketController.updateStatus);

// DELETE /api/servicetickets/:id - Delete a service ticket
router.delete('/:id', ticketController.deleteTicket);

// POST /api/servicetickets/upload - Upload device condition photo
router.post('/upload', ticketController.uploadTicketImage);

module.exports = router;
