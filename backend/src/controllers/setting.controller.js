const settingModel = require('../models/setting.model');
const { cache } = require('../config/redis');
const { deleteOldImage } = require('../config/upload');
const path = require('path');

const CACHE_KEY = 'print_settings';

// Get print settings
const getPrintSettings = async (req, res) => {
  try {
    const branchId = req.user?.branchId;
    const cacheKey = branchId ? `${CACHE_KEY}:${branchId}` : CACHE_KEY;

    // Try cache first
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        data: cachedData,
        fromCache: true
      });
    }

    const settings = await settingModel.getPrintSettings(branchId);
    
    // Cache for 5 minutes
    await cache.set(cacheKey, settings, 300);
    
    res.json({
      success: true,
      data: settings,
      fromCache: false
    });
  } catch (error) {
    console.error('getPrintSettings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch print settings'
    });
  }
};

// Update print settings
const updatePrintSettings = async (req, res) => {
  try {
    const branchId = req.user?.branchId;
    const cacheKey = branchId ? `${CACHE_KEY}:${branchId}` : CACHE_KEY;
    
    const { ShopName, Address, PhoneNo, Logo, ChkLogo, FooterMessage, WarrantyPolicy } = req.body;

    // Get existing settings to delete old logo if new one is uploaded
    const existing = await settingModel.getPrintSettings(branchId);
    
    // If new logo is provided and different from old, delete old logo
    if (Logo && Logo !== existing.Logo && existing.Logo) {
      deleteOldImage(existing.Logo);
    }
    
    const updated = await settingModel.updatePrintSettings({
      ShopName: ShopName || existing.ShopName || '',
      Address: Address || existing.Address || '',
      PhoneNo: PhoneNo || existing.PhoneNo || '',
      Logo: Logo || existing.Logo || '',
      ChkLogo: ChkLogo !== undefined ? ChkLogo : (existing.ChkLogo || 0),
      FooterMessage: FooterMessage || existing.FooterMessage || '',
      WarrantyPolicy: WarrantyPolicy || existing.WarrantyPolicy || ''
    }, branchId);
    
    // Invalidate cache
    await cache.del(cacheKey);
    
    res.json({
      success: true,
      data: updated,
      message: 'Print settings updated successfully'
    });
  } catch (error) {
    console.error('updatePrintSettings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update print settings'
    });
  }
};

// Upload logo
const uploadLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const branchId = req.user?.branchId;
    const cacheKey = branchId ? `${CACHE_KEY}:${branchId}` : CACHE_KEY;

    // Get existing settings to delete old logo
    const existing = await settingModel.getPrintSettings(branchId);
    
    // Delete old logo if exists
    if (existing.Logo) {
      deleteOldImage(existing.Logo);
    }

    // File path relative to /assets
    const logoPath = `/assets/printsetting/${req.file.filename}`;
    
    // Update settings with new logo path
    const updated = await settingModel.updatePrintSettings({
      ShopName: existing.ShopName || '',
      Address: existing.Address || '',
      PhoneNo: existing.PhoneNo || '',
      Logo: logoPath,
      ChkLogo: existing.ChkLogo || 0,
      FooterMessage: existing.FooterMessage || '',
      WarrantyPolicy: existing.WarrantyPolicy || ''
    }, branchId);
    
    // Invalidate cache
    await cache.del(cacheKey);
    
    res.json({
      success: true,
      data: {
        Logo: logoPath,
        fullPath: `${req.protocol}://${req.get('host')}${logoPath}`
      },
      message: 'Logo uploaded successfully'
    });
  } catch (error) {
    console.error('uploadLogo error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload logo'
    });
  }
};

module.exports = {
  getPrintSettings,
  updatePrintSettings,
  uploadLogo
};
