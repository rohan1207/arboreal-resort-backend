import express from 'express';
import {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
} from '../controllers/eventController.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../config/cloudinary.js';

const router = express.Router();

console.log('[EVENT-ROUTES] Event routes module loaded');

const uploadFields = upload.fields([
  { name: 'mainImage', maxCount: 1 },
  { name: 'galleryImages' },
]);

console.log('[EVENT-ROUTES] Upload fields middleware configured');

// Add logging middleware for all event routes
router.use((req, res, next) => {
  console.log(`[EVENT-ROUTES] ${req.method} ${req.path} - Request received`);
  console.log('[EVENT-ROUTES] Headers:', JSON.stringify(req.headers, null, 2));
  console.log('[EVENT-ROUTES] Content-Type:', req.get('Content-Type'));
  next();
});

router.route('/')
  .get(getEvents)
  .post(protect, (req, res, next) => {
    console.log('[EVENT-ROUTES] POST /events - Before uploadFields middleware');
    console.log('[EVENT-ROUTES] Request body size:', req.get('Content-Length'), 'bytes');
    const startTime = Date.now();
    req.uploadStartTime = startTime;
    next();
  }, (req, res, next) => {
    console.log('[EVENT-ROUTES] POST /events - Starting uploadFields processing...');
    next();
  }, uploadFields, (req, res, next) => {
    const processingTime = Date.now() - req.uploadStartTime;
    console.log(`[EVENT-ROUTES] POST /events - After uploadFields middleware (took ${processingTime}ms)`);
    console.log('[EVENT-ROUTES] Files received:', req.files ? Object.keys(req.files) : 'No files');
    if (req.files) {
      Object.keys(req.files).forEach(key => {
        console.log(`[EVENT-ROUTES] ${key}:`, req.files[key].map(f => `${f.originalname} (${f.size} bytes)`));
      });
    }
    next();
  }, createEvent);

router.route('/:id')
  .get(getEventById)
  .put(protect, (req, res, next) => {
    console.log('[EVENT-ROUTES] PUT /events/:id - Before uploadFields middleware');
    console.log('[EVENT-ROUTES] Request body size:', req.get('Content-Length'), 'bytes');
    const startTime = Date.now();
    req.uploadStartTime = startTime;
    next();
  }, uploadFields, (req, res, next) => {
    const processingTime = Date.now() - req.uploadStartTime;
    console.log(`[EVENT-ROUTES] PUT /events/:id - After uploadFields middleware (took ${processingTime}ms)`);
    console.log('[EVENT-ROUTES] Files received:', req.files ? Object.keys(req.files) : 'No files');
    next();
  }, updateEvent)
  .delete(protect, deleteEvent);

export { router as eventRoutes };