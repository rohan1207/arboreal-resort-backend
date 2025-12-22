import express from 'express';
import { getPublicGlobalSettings } from '../controllers/globalSettingsController.js';

const router = express.Router();

router.get('/', getPublicGlobalSettings);

export default router;


