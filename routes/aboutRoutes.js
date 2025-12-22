import express from 'express';
import { getPublicAboutSettings } from '../controllers/aboutSettingsController.js';

const router = express.Router();

router.get('/', getPublicAboutSettings);

export default router;


