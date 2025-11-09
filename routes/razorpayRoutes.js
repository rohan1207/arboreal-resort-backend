import express from 'express';
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
} from '../controllers/razorpayController.js';

const router = express.Router();

// Create Razorpay order (after booking is created and reservation number is received)
router.post('/create-order', createRazorpayOrder);

// Verify Razorpay payment and confirm booking
router.post('/verify', verifyRazorpayPayment);

export default router;
