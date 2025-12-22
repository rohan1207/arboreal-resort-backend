import express from 'express';
import multer from 'multer';
import { protect } from '../middleware/authMiddleware.js';
import { getHomeSettings, updateHomeSettings } from '../controllers/homeSettingsController.js';

const router = express.Router();

// Multer storage (memory) for hero video, posters, and images
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB per file (for hero video)
    files: 30,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'), false);
    }
  },
  // Allow additional text fields to pass through to req.body
  preservePath: false,
});

// Multer error handler middleware
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 50MB per file',
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`,
    });
  }
  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'File upload error',
    });
  }
  next();
};

// Protect all routes
router.use(protect);

router.get('/', getHomeSettings);
router.put(
  '/',
  // Use upload.any() to accept all fields (files and text), then validate files
  upload.any(),
  // Custom middleware to organize files by field name and validate
  (req, res, next) => {
    // Allowed file field names
    const allowedFileFields = [
      'heroVideo',
      'heroPoster',
      'sliderImages',
      'accommodation1Image',
      'accommodation2Image',
    ];

    // Organize files into req.files object structure expected by controller
    if (req.files && req.files.length > 0) {
      const organizedFiles = {};
      req.files.forEach((file) => {
        const fieldName = file.fieldname;
        // Only process allowed file fields
        if (allowedFileFields.includes(fieldName)) {
          if (!organizedFiles[fieldName]) {
            organizedFiles[fieldName] = [];
          }
          organizedFiles[fieldName].push(file);
        }
        // Ignore unexpected file fields (don't error, just skip them)
      });
      req.files = organizedFiles;
    } else {
      req.files = {};
    }
    next();
  },
  handleMulterError,
  updateHomeSettings
);

export default router;


