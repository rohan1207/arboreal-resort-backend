import express from 'express';

const router = express.Router();

// Middleware for parsing JSON and urlencoded data
router.use(express.json({ limit: '50mb' }));
router.use(express.urlencoded({ extended: true, limit: '50mb' }));

export default router;
