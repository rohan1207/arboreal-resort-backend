import express from 'express';
import { getGlobalSEO } from '../controllers/seoController.js';

const router = express.Router();

// @route   GET /api/seo
// @desc    Get global SEO settings (public)
// @access  Public
router.get('/', getGlobalSEO);

export default router;

