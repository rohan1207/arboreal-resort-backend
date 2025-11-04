import express from 'express';
import { searchRooms, getRoomDetails } from '../controllers/bookingController.js';

const router = express.Router();

// Search for available rooms
router.post('/search', searchRooms);

// Get room details by ID
router.get('/room/:roomId', getRoomDetails);

export default router;
