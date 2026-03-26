import { cloudinary } from '../config/cloudinary.js';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

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

/**
 * Extract Cloudinary public_id from a secure URL.
 * Works for URLs like:
 * https://res.cloudinary.com/<cloud>/image/upload/v1693678435/folder/name.jpg
 * @param {string} url
 * @returns {string} public_id (e.g. folder/name)
 */
export const getPublicIdFromUrl = (url) => {
  try {
    const parts = url.split('/upload/');
    if (parts.length < 2) return null;
    let path = parts[1]; // v1234567/folder/file.jpg
    // Remove version segment if present
    if (path.startsWith('v')) {
      path = path.substring(path.indexOf('/') + 1);
    }
    // Strip extension
    return path.replace(/\.[^/.]+$/, '');
  } catch (err) {
    console.error('[CloudinaryDelete] Failed to parse public_id from URL:', url, err);
    return null;
  }
};

/**
 * Destroy an asset on Cloudinary given its URL.
 * Safe: ignores errors, returns boolean success flag.
 */
export const deleteByUrl = async (url) => {
  // If this URL belongs to R2 public base, delete from R2.
  if (hasR2Config && r2Client && url && url.startsWith(`${R2_PUBLIC_BASE_URL}/`)) {
    try {
      const key = decodeURIComponent(url.replace(`${R2_PUBLIC_BASE_URL}/`, ''));
      if (!key) return false;
      await r2Client.send(
        new DeleteObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: key,
        })
      );
      return true;
    } catch (err) {
      console.error('[R2Delete] Failed to delete object by URL:', url, err);
      return false;
    }
  }

  const publicId = getPublicIdFromUrl(url);
  if (!publicId) return false;
  try {
    await cloudinary.uploader.destroy(publicId, { invalidate: true });
    return true;
  } catch (err) {
    console.error('[CloudinaryDelete] Failed to destroy', publicId, err);
    return false;
  }
};
