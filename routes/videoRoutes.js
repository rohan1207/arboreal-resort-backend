import express from 'express';
import { getVideos, createVideo, deleteVideo } from '../controllers/videoController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getVideos)
  .post(protect, createVideo);

router.route('/:id')
  .delete(protect, deleteVideo);

export default router;
