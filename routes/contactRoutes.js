import express from 'express';
import { getPublicContactSettings, submitContactForm } from '../controllers/contactSettingsController.js';

const router = express.Router();

// @route   GET /api/contact
// @desc    Get contact settings (public)
// @access  Public
router.get('/', getPublicContactSettings);

// @route   POST /api/contact/send
// @desc    Submit contact form (sends email to reservations)
// @access  Public
router.post('/send', submitContactForm);

export default router;

