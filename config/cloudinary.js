import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';

import dotenv from 'dotenv';

dotenv.config();

// Automatically configures using CLOUDINARY_URL env var, but we can explicitly set values if desired.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dldr8qqxu',
  api_key: process.env.CLOUDINARY_API_KEY || '731146445771635',
  api_secret: process.env.CLOUDINARY_API_SECRET || undefined, // Keep secret in .env
});

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