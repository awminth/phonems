const express = require('express');
const router = express.Router();
const branchController = require('../controllers/branch.controller');

// GET /api/branches - Get all branches
router.get('/', branchController.getBranches);

// GET /api/branches/:id - Get branch by ID
router.get('/:id', branchController.getBranchById);

// POST /api/branches - Create branch
router.post('/', branchController.createBranch);

// PUT /api/branches/:id - Update branch
router.put('/:id', branchController.updateBranch);

// DELETE /api/branches/:id - Delete branch
router.delete('/:id', branchController.deleteBranch);

// POST /api/branches/upload-logo - Upload branch logo
router.post('/upload-logo', branchController.uploadBranchLogo);

module.exports = router;
