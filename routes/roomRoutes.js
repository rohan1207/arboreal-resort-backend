import express from 'express';
import { getRooms } from '../controllers/roomController.js';

const router = express.Router();

// Public rooms listing
router.get('/', getRooms);

export default router;


