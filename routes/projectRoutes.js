import express from 'express';
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
} from '../controllers/projectController.js';
import { upload } from '../config/cloudinary.js';

const router = express.Router();

console.log('[ROUTES] Project routes module loaded');

// Upload config: mainImage (single), galleryImages (multiple)
const uploadFields = upload.fields([
  { name: 'mainImage', maxCount: 1 },
  { name: 'galleryImages' },
]);

console.log('[ROUTES] Upload fields middleware configured');

// Add logging middleware for all project routes
router.use((req, res, next) => {
  console.log(`[ROUTES] ${req.method} ${req.path} - Request received`);
  console.log('[ROUTES] Headers:', JSON.stringify(req.headers, null, 2));
  console.log('[ROUTES] Content-Type:', req.get('Content-Type'));
  next();
});

// Add specific logging for POST route (no timeout for multiple file uploads)
router.route('/').get(getProjects).post((req, res, next) => {
  console.log('[ROUTES] POST /projects - Before uploadFields middleware');
  console.log('[ROUTES] Request body size:', req.get('Content-Length'), 'bytes');
  const startTime = Date.now();
  req.uploadStartTime = startTime;
  next();
}, (req, res, next) => {
  console.log('[ROUTES] POST /projects - Starting uploadFields processing...');
  next();
}, uploadFields, (req, res, next) => {
  const processingTime = Date.now() - req.uploadStartTime;
  console.log(`[ROUTES] POST /projects - After uploadFields middleware (took ${processingTime}ms)`);
  console.log('[ROUTES] Files received:', req.files ? Object.keys(req.files) : 'No files');
  if (req.files) {
    Object.keys(req.files).forEach(key => {
      console.log(`[ROUTES] ${key}:`, req.files[key].map(f => `${f.originalname} (${f.size} bytes)`));
    });
  }
  next();
}, createProject);
router
  .route('/:id')
  .get(getProjectById)
  .put(uploadFields, updateProject)
  .delete(deleteProject);

export default router;
