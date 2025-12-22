import express from 'express';
import { createInquiry, getInquiries, updateInquiry } from '../controllers/inquiryController.js';

const router = express.Router();

// Create a new inquiry
router.post('/', createInquiry);

// Get all inquiries
router.get('/', getInquiries);

// Update inquiry
router.put('/:id', updateInquiry);

export default router;




















