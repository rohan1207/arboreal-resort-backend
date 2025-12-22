import express from 'express';
import {
  getGlobalSEO,
  updateGlobalSEO,
  generateSitemap,
  markSitemapSubmitted,
  getSEOHealth,
} from '../controllers/seoController.js';
import { protect } from '../middleware/authMiddleware.js';
import multer from 'multer';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

// All routes require authentication
router.use(protect);

// @route   GET /api/admin/seo
// @desc    Get global SEO settings
// @access  Private
router.get('/', getGlobalSEO);

// @route   PUT /api/admin/seo
// @desc    Update global SEO settings
// @access  Private
router.put(
  '/',
  upload.fields([
    { name: 'defaultOgImage', maxCount: 1 },
    { name: 'defaultFacebookImage', maxCount: 1 },
    { name: 'defaultTwitterImage', maxCount: 1 },
  ]),
  updateGlobalSEO
);

// @route   POST /api/admin/seo/sitemap/generate
// @desc    Generate sitemap
// @access  Private
router.post('/sitemap/generate', generateSitemap);

// @route   POST /api/admin/seo/sitemap/submit
// @desc    Mark sitemap as submitted
// @access  Private
router.post('/sitemap/submit', markSitemapSubmitted);

// @route   GET /api/admin/seo/health
// @desc    Get SEO health status
// @access  Private
router.get('/health', getSEOHealth);

export default router;

