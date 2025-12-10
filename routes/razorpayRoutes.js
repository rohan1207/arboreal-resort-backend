import express from 'express';
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  refundRazorpayPayment,
} from '../controllers/razorpayController.js';

const router = express.Router();

// Create Razorpay order (NEW FLOW: before booking creation)
router.post('/create-order', createRazorpayOrder);

// Verify Razorpay payment and create booking (NEW FLOW: payment first, then booking)
router.post('/verify-payment', verifyRazorpayPayment);

// Refund Razorpay payment (for manual/admin use or error recovery)
router.post('/refund', refundRazorpayPayment);

export default router;
