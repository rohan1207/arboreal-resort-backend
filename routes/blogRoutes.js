import express from 'express';
import multer from 'multer';
import {
  getBlogs,
  getBlogBySlug,
} from '../controllers/blogController.js';

const router = express.Router();

// Public routes
router.get('/', getBlogs);
router.get('/:slug', getBlogBySlug);

export default router;

