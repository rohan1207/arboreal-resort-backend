import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getGlobalSettings, updateGlobalSettings } from '../controllers/globalSettingsController.js';

const router = express.Router();

router.use(protect);

router.get('/', getGlobalSettings);
router.put('/', updateGlobalSettings);

export default router;


