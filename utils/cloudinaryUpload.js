import { cloudinary } from '../config/cloudinary.js';
import sharp from 'sharp';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';

const STORAGE_PROVIDER = (process.env.STORAGE_PROVIDER || 'cloudinary').toLowerCase();

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '';
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || '';
const R2_PUBLIC_BASE_URL = (process.env.R2_PUBLIC_BASE_URL || '').replace(/\/$/, '');

const hasR2Config =
  !!R2_ACCOUNT_ID &&
  !!R2_ACCESS_KEY_ID &&
  !!R2_SECRET_ACCESS_KEY &&
  !!R2_BUCKET_NAME &&
  !!R2_PUBLIC_BASE_URL;

const r2Client = hasR2Config
  ? new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    })
  : null;

const sanitizePath = (value = '') =>
  String(value)
    .trim()
    .replace(/^\/+|\/+$/g, '')
    .replace(/[^a-zA-Z0-9/_-]/g, '');

const inferExtension = (mimetype = '', originalname = '') => {
  const fromOriginal = (originalname.split('.').pop() || '').toLowerCase();
  if (fromOriginal && fromOriginal.length <= 5) return `.${fromOriginal}`;
  if (mimetype.includes('jpeg')) return '.jpg';
  if (mimetype.includes('png')) return '.png';
  if (mimetype.includes('webp')) return '.webp';
  if (mimetype.includes('gif')) return '.gif';
  if (mimetype.includes('svg')) return '.svg';
  if (mimetype.includes('mp4')) return '.mp4';
  if (mimetype.includes('webm')) return '.webm';
  if (mimetype.includes('quicktime')) return '.mov';
  return '';
};

/**
 * Upload a file buffer to Cloudinary using an upload_stream, returning the secure URL.
 * @param {object} file - Multer file object containing a Buffer.
 * @param {string} folder - Cloudinary folder to store the file in.
 * @returns {Promise<string>} The uploaded image URL.
 */
export const uploadBufferToCloudinary = async (file, folder = '') => {
  let bufferToUpload = file.buffer;
  // Only compress if image is very large (>5MB) to maintain quality
  // For blog images, we want to keep them clear unless they're too large
  if (file.mimetype.startsWith('image/') && file.size > 5 * 1024 * 1024) {
    try {
      // For very large images, compress but maintain good quality
      bufferToUpload = await sharp(file.buffer)
        .rotate()
        .resize({ width: 1920, withoutEnlargement: true })
        .jpeg({ quality: 85, progressive: true })
        .toBuffer();
      console.log(`[COMPRESSION] Compressed large image from ${(file.size / 1024 / 1024).toFixed(2)}MB`);
    } catch (err) {
      console.error('[COMPRESSION] Failed, uploading original buffer', err.message);
    }
  } else if (file.mimetype.startsWith('image/') && file.size > 1 * 1024 * 1024) {
    // For medium images (1-5MB), only optimize format, don't compress much
    try {
      bufferToUpload = await sharp(file.buffer)
        .rotate()
        .jpeg({ quality: 92, progressive: true })
        .toBuffer();
    } catch (err) {
      console.error('[OPTIMIZATION] Failed, uploading original buffer', err.message);
    }
  }

  if (STORAGE_PROVIDER === 'r2') {
    if (!hasR2Config || !r2Client) {
      throw new Error(
        'R2 storage selected but configuration is incomplete. Please set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, and R2_PUBLIC_BASE_URL.'
      );
    }

    const folderPath = sanitizePath(folder);
    const filenameBase = `${Date.now()}-${crypto.randomUUID()}`;
    const ext = inferExtension(file.mimetype, file.originalname);
    const key = folderPath ? `${folderPath}/${filenameBase}${ext}` : `${filenameBase}${ext}`;

    await r2Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: bufferToUpload,
        ContentType: file.mimetype || 'application/octet-stream',
      })
    );

    return `${R2_PUBLIC_BASE_URL}/${key}`;
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto',
        use_filename: false,
        unique_filename: true,
        timeout: 600000,
        overwrite: false,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      },
    );

    stream.end(bufferToUpload);
  });
};
