const branchModel = require('../models/branch.model');
const { cache } = require('../config/redis');
const { uploadPrintSettingLogo, getPrintSettingLogoPath, deleteOldImage } = require('../config/upload');

const CACHE_PREFIX = 'branches';

// Upload logo for branch
const uploadBranchLogo = async (req, res) => {
  uploadPrintSettingLogo(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload failed'
      });
    }

    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No logo file provided'
        });
      }

      const logoPath = getPrintSettingLogoPath(req.file.filename);

      res.json({
        success: true,
        message: 'Logo uploaded successfully',
        data: {
          logoPath: logoPath,
          filename: req.file.filename
        }
      });
    } catch (error) {
      console.error('uploadBranchLogo error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload logo: ' + error.message
      });
    }
  });
};

// Get all branches
const getBranches = async (req, res) => {
  try {
    const cachedData = await cache.get(CACHE_PREFIX);
    if (cachedData) {
      return res.json({
        success: true,
        data: cachedData,
        fromCache: true
      });
    }

    const branches = await branchModel.findAll();
    
    await cache.set(CACHE_PREFIX, branches, 300);
    
    res.json({
      success: true,
      data: branches,
      fromCache: false
    });
  } catch (error) {
    console.error('getBranches error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch branches'
    });
  }
};

// Get branch by ID
const getBranchById = async (req, res) => {
  try {
    const { id } = req.params;
    const branch = await branchModel.findById(id);
    
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }

    res.json({
      success: true,
      data: branch
    });
  } catch (error) {
    console.error('getBranchById error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch branch'
    });
  }
};

// Create branch
const createBranch = async (req, res) => {
  try {
    const data = req.body;
    const result = await branchModel.create(data);

    await cache.del(CACHE_PREFIX);

    res.status(201).json({
      success: true,
      message: 'Branch created successfully',
      data: result
    });
  } catch (error) {
    console.error('createBranch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create branch: ' + error.message
    });
  }
};

// Update branch
const updateBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    // If logo is changed, we might want to delete the old one
    // But for now, just update the DB
    const existingBranch = await branchModel.findById(id);
    if (existingBranch && existingBranch.logo && data.logo && existingBranch.logo !== data.logo) {
      deleteOldImage(existingBranch.logo);
    }

    const result = await branchModel.update(id, data);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }

    await cache.del(CACHE_PREFIX);

    res.json({
      success: true,
      message: 'Branch updated successfully',
      data: result
    });
  } catch (error) {
    console.error('updateBranch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update branch: ' + error.message
    });
  }
};

// Delete branch
const deleteBranch = async (req, res) => {
  try {
    const { id } = req.params;
    
    const existingBranch = await branchModel.findById(id);
    if (existingBranch && existingBranch.logo) {
      deleteOldImage(existingBranch.logo);
    }

    const result = await branchModel.delete(id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }

    await cache.del(CACHE_PREFIX);

    res.json({
      success: true,
      message: 'Branch deleted successfully'
    });
  } catch (error) {
    console.error('deleteBranch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete branch'
    });
  }
};

module.exports = {
  uploadBranchLogo,
  getBranches,
  getBranchById,
  createBranch,
  updateBranch,
  deleteBranch
};
