import express from 'express';
import { 
  searchRooms, 
  getRoomDetails, 
  createBooking,
  processBooking,
  getExtraCharges,
  calculateExtraCharge,
  getPaymentGateways
} from '../controllers/bookingController.js';
import { createRazorpayOrder, verifyRazorpayPayment } from '../controllers/razorpayController.js';

const router = express.Router();

// Search for available rooms
router.post('/search', searchRooms);

// Get room details by ID
router.get('/room/:roomId', getRoomDetails);

// Create a new booking
router.post('/create', createBooking);

// Process booking (confirm or cancel after payment)
router.post('/process', processBooking);

// Get available extra charges
router.get('/extras', getExtraCharges);

// Calculate extra charge cost
router.post('/calculate-extras', calculateExtraCharge);

// Get configured payment gateways
router.get('/payment-gateways', getPaymentGateways);

// Razorpay payment integration
router.post('/razorpay/create-order', createRazorpayOrder);
router.post('/razorpay/verify-payment', verifyRazorpayPayment);

export default router;
