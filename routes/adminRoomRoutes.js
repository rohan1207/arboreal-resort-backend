import express from 'express';
import multer from 'multer';
import { protect } from '../middleware/authMiddleware.js';
import {
  getAdminRooms,
  getAdminRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
} from '../controllers/roomController.js';

const router = express.Router();

// Configure multer for room image uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 20,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

// Multer error handler middleware
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 10MB per image',
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

// All routes require admin auth
router.use(protect);

// Admin room routes
router.get('/', getAdminRooms);
router.get('/:id', getAdminRoomById);
router.post(
  '/',
  upload.fields([{ name: 'images', maxCount: 20 }]),
  handleMulterError,
  createRoom
);
router.put(
  '/:id',
  upload.fields([{ name: 'images', maxCount: 20 }]),
  handleMulterError,
  updateRoom
);
router.delete('/:id', deleteRoom);

export default router;


