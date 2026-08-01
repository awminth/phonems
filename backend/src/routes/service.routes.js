const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/service.controller');

// GET /api/services - Get all services
router.get('/', serviceController.getServices);

// GET /api/services/:id - Get service by ID
router.get('/:id', serviceController.getServiceById);

// POST /api/services - Create a new service
router.post('/', serviceController.createService);

// PUT /api/services/:id - Update a service
router.put('/:id', serviceController.updateService);

// DELETE /api/services/:id - Delete a service
router.delete('/:id', serviceController.deleteService);

module.exports = router;
