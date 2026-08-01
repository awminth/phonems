const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Base path for server folder (server/src/config -> server)
const SERVER_ROOT = path.join(__dirname, '../..');

// Ensure upload directory exists
const createUploadDir = (dir) => {
  const fullPath = path.join(SERVER_ROOT, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
  return fullPath;
};

// Purchase images storage
const purchaseStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = createUploadDir('public/assets/purchase');
    console.log('Upload path:', uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp_randomstring.ext
    const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `purchase_${uniqueSuffix}${ext}`);
  }
});

// File filter for images only
const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Print setting logo storage
const printSettingStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = createUploadDir('public/assets/printsetting');
    console.log('Upload path:', uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp_randomstring.ext
    const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `logo_${uniqueSuffix}${ext}`);
  }
});

// Multer upload configurations
const uploadPurchaseImage = multer({
  storage: purchaseStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: imageFilter
}).single('image');

// Print setting logo upload
const uploadPrintSettingLogo = multer({
  storage: printSettingStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: imageFilter
}).single('logo');

// Helper to delete old image
const deleteOldImage = (imagePath) => {
  if (!imagePath) return;
  
  try {
    // imagePath is like /assets/purchase/filename.jpg
    // We need to prepend 'public' to get the full path
    const relativePath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
    const fullPath = path.join(SERVER_ROOT, 'public', relativePath);
    
    console.log('Deleting image:', fullPath);
    
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log('Deleted old image:', imagePath);
    }
  } catch (error) {
    console.error('Error deleting old image:', error.message);
  }
};

// Get image URL path from filename
// Service ticket condition images storage
const serviceStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = createUploadDir('public/assets/service');
    console.log('Upload path:', uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `service_${uniqueSuffix}${ext}`);
  }
});

const uploadServiceImage = multer({
  storage: serviceStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: imageFilter
}).single('image');

const getImagePath = (filename) => {
  return `/assets/purchase/${filename}`;
};

const getPrintSettingLogoPath = (filename) => {
  return `/assets/printsetting/${filename}`;
};

const getServiceImagePath = (filename) => {
  return `/assets/service/${filename}`;
};

module.exports = {
  uploadPurchaseImage,
  uploadPrintSettingLogo,
  uploadServiceImage,
  deleteOldImage,
  getImagePath,
  getPrintSettingLogoPath,
  getServiceImagePath,
  createUploadDir,
  SERVER_ROOT
};
