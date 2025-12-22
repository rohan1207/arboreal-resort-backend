import express from 'express';
import { getPublicActivities } from '../controllers/activityController.js';

const router = express.Router();

router.get('/', getPublicActivities);

export default router;

