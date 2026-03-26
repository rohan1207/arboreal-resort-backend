import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';

import dotenv from 'dotenv';

dotenv.config();

// Automatically configures using CLOUDINARY_URL env var, but we can explicitly set values if desired.
// Use environment variables if available, otherwise use the credentials from the project
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'ddfuu6bop',
  api_key: process.env.CLOUDINARY_API_KEY || 'daYpxdvUO57iyIvyZh3swpDsIQw',
  api_secret: process.env.CLOUDINARY_API_SECRET || '417893748926271', // Keep secret in .env for production
});

// Verify configuration
if (!cloudinary.config().api_secret) {
  console.error('[CLOUDINARY] ⚠️  WARNING: API secret not configured! Image uploads will fail.');
} else {
  console.log('[CLOUDINARY] ✅ Configuration loaded successfully');
}

// Use in-memory storage. Files will be available as Buffer in `req.file[s]` and
// later handled by sharp + cloudinaryUpload utils for compression & upload.
const storage = multer.memoryStorage();

console.log('[CLOUDINARY] Multer memoryStorage configured (buffers in RAM).');

const upload = multer({
  storage,
  limits: { 
    fileSize: 500 * 1024 * 1024, // 500MB per file
    files: 50, // allow up to 50 files per request
    fields: 100 // allow 100 non-file fields
  },
  fileFilter: (req, file, cb) => {
    console.log(`[MULTER] Processing file: ${file.originalname} (${file.mimetype})`);
    cb(null, true);
  },
  onError: (err, next) => {
    console.error('[MULTER] Error occurred:', err);
    next(err);
  },
});

console.log('[CLOUDINARY] Multer upload middleware configured');

export { cloudinary, upload };