import express from 'express';
import { getPublicGallerySettings } from '../controllers/gallerySettingsController.js';

const router = express.Router();

// Get gallery settings (public)
router.get('/', getPublicGallerySettings);

export default router;


