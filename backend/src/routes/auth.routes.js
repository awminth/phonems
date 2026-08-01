const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// POST /api/auth/login - Login
router.post('/login', authController.login);

// POST /api/auth/change-password - Change password
router.post('/change-password', authController.changePassword);

// POST /api/auth/logout - Log logout event
router.post('/logout', authController.logout);

module.exports = router;

