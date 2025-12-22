import express from 'express';
import { getPublicContactSettings } from '../controllers/contactSettingsController.js';

const router = express.Router();

// @route   GET /api/contact
// @desc    Get contact settings (public)
// @access  Public
router.get('/', getPublicContactSettings);

export default router;

