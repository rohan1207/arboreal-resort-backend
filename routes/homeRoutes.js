import express from 'express';
import { getPublicHomeSettings } from '../controllers/homeSettingsController.js';

const router = express.Router();

router.get('/', getPublicHomeSettings);

export default router;


