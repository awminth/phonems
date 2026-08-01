const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');

// GET /api/users - Get all users with pagination
router.get('/', userController.getUsers);

// GET /api/users/:id - Get single user
router.get('/:id', userController.getUserById);

// POST /api/users - Create new user
router.post('/', userController.createUser);

// PUT /api/users/:id - Update user
router.put('/:id', userController.updateUser);

// DELETE /api/users/:id - Delete user
router.delete('/:id', userController.deleteUser);

module.exports = router;

