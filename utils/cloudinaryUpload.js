import { cloudinary } from '../config/cloudinary.js';
import sharp from 'sharp';

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

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto',
        use_filename: false,      // let Cloudinary generate a unique ID
        unique_filename: true,    // guarantee uniqueness even if original names repeat (e.g. 'file')
        timeout: 600000,        // 10-minute timeout per upload to prevent Cloudinary 499 errors
        overwrite: false,         // do NOT overwrite previously uploaded files
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      },
    );

    stream.end(bufferToUpload);
  });
};
