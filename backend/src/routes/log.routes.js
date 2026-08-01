const express = require('express');
const router = express.Router();
const logController = require('../controllers/log.controller');

// GET /api/logs - Get all logs with pagination
router.get('/', logController.getLogs);

// GET /api/logs/user/:userId - Get logs by user ID
router.get('/user/:userId', logController.getLogsByUserId);

// POST /api/logs - Create log entry
router.post('/', logController.createLog);

module.exports = router;

