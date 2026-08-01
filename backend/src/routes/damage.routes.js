const express = require('express');
const router = express.Router();
const damageController = require('../controllers/damage.controller');

// GET /api/damages - Get all damage records
router.get('/', damageController.getDamages);

// POST /api/damages - Create new damage record
router.post('/', damageController.createDamage);

// DELETE /api/damages/:id - Delete damage record
router.delete('/:id', damageController.deleteDamage);

module.exports = router;
