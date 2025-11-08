import express from 'express';
import {
  createOrder,
  verifyPayment,
  handlePaymentFailure,
} from '../controllers/razorpayController.js';

const router = express.Router();

// Create Razorpay order (after booking is created and reservation number is received)
router.post('/create-order', createOrder);

// Verify Razorpay payment and confirm booking
router.post('/verify', verifyPayment);

// Handle payment failure and mark booking as failed
router.post('/fail', handlePaymentFailure);

export default router;
