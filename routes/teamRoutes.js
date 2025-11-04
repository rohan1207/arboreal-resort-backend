import express from 'express';
import {
  createTeamMember,
  getTeamMembers,
  updateTeamMember,
  deleteTeamMember,
  createIntern,
  getInterns,
  updateIntern,
  deleteIntern,
} from '../controllers/teamController.js';
import { upload } from '../config/cloudinary.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// --- Team Member Routes ---
router.route('/members')
  .get(getTeamMembers)
  .post(protect, upload.single('image'), createTeamMember);

router.route('/members/:id')
  .put(protect, upload.single('image'), updateTeamMember)
  .delete(protect, deleteTeamMember);

// --- Intern Routes ---
router.route('/interns')
  .get(getInterns)
  .post(protect, upload.single('image'), createIntern);

router.route('/interns/:id')
  .put(protect, upload.single('image'), updateIntern)
  .delete(protect, deleteIntern);

export default router;
