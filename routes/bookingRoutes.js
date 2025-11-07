import express from 'express';
import { 
  searchRooms, 
  getRoomDetails, 
  createBooking,
  getExtraCharges,
  calculateExtraCharge,
  getPaymentGateways
} from '../controllers/bookingController.js';

const router = express.Router();

// Search for available rooms
router.post('/search', searchRooms);

// Get room details by ID
router.get('/room/:roomId', getRoomDetails);

// Create a new booking
router.post('/create', createBooking);

// Get available extra charges
router.get('/extras', getExtraCharges);

// Calculate extra charge cost
router.post('/calculate-extras', calculateExtraCharge);

// Get configured payment gateways
router.get('/payment-gateways', getPaymentGateways);

export default router;
