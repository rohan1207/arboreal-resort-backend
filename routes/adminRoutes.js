import express from 'express';
import { loginAdmin, registerAdmin } from '../controllers/adminController.js';

const router = express.Router();

router.post('/login', loginAdmin);
// Uncomment below to allow registering admins (ensure secure in production)
// router.post('/register', registerAdmin);

export default router;
