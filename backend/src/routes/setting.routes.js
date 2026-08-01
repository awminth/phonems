const express = require('express');
const router = express.Router();
const {
  getPrintSettings,
  updatePrintSettings,
  uploadLogo
} = require('../controllers/setting.controller');
const { uploadPrintSettingLogo } = require('../config/upload');

// GET /api/settings/print - Get print settings
router.get('/print', getPrintSettings);

// PUT /api/settings/print - Update print settings
router.put('/print', updatePrintSettings);

// POST /api/settings/print/logo - Upload logo
router.post('/print/logo', uploadPrintSettingLogo, uploadLogo);

module.exports = router;

