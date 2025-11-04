import { cloudinary } from '../config/cloudinary.js';

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
