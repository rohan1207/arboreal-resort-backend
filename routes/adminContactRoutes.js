import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getContactSettings,
  updateContactSettings,
} from '../controllers/contactSettingsController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// @route   GET /api/admin/contact
// @desc    Get contact settings
// @access  Private
router.get('/', getContactSettings);

// @route   PUT /api/admin/contact
// @desc    Update contact settings
// @access  Private
router.put('/', updateContactSettings);

export default router;

