import express from 'express';
import {
  getHeroImage,
  updateHeroImage,
} from '../controllers/heroImageController.js';
import multer from 'multer';

const router = express.Router();

// Set up multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.route('/').get(getHeroImage).put(upload.single('image'), updateHeroImage);

export default router;
