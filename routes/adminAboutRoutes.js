import express from 'express';
import multer from 'multer';
import { protect } from '../middleware/authMiddleware.js';
import { getAboutSettings, updateAboutSettings } from '../controllers/aboutSettingsController.js';

const router = express.Router();

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 30,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

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

router.use(protect);

router.get('/', getAboutSettings);
router.put(
  '/',
  upload.any(),
  (req, res, next) => {
    try {
      const isArray = Array.isArray(req.files);
      const files = isArray ? req.files : [];
      console.log('[ABOUT ROUTE][ADMIN] PUT /api/admin/about received request', {
        bodyKeys: Object.keys(req.body || {}),
        filesCount: files.length,
        fileFieldnames: files.map((f) => f.fieldname),
        fileSummaries: files.map((f) => ({
          fieldname: f.fieldname,
          originalname: f.originalname,
          mimetype: f.mimetype,
          size: f.size,
        })),
      });
    } catch (logErr) {
      console.error('[ABOUT ROUTE][ADMIN] Failed to log request debug info:', logErr.message);
    }
    next();
  },
  handleMulterError,
  updateAboutSettings
);

export default router;


