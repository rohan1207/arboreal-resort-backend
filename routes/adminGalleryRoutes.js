import express from 'express';
import multer from 'multer';
import { protect } from '../middleware/authMiddleware.js';
import {
  getGallerySettings,
  addGalleryImages,
  removeGalleryImages,
  updateGalleryImage,
} from '../controllers/gallerySettingsController.js';

const router = express.Router();

// Multer storage (memory) for gallery images
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 50, // Allow up to 50 images at once
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
  preservePath: false,
});

// Multer error handler middleware
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 10MB per file',
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

// Get gallery settings
router.get('/', getGallerySettings);

// Add gallery images
router.post(
  '/images',
  upload.fields([{ name: 'galleryImages', maxCount: 50 }]),
  handleMulterError,
  addGalleryImages
);

// Remove selected gallery images
router.delete('/images', removeGalleryImages);

// Update single gallery image (alt text)
router.put('/images/:id', updateGalleryImage);

export default router;

