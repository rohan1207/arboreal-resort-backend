import { cloudinary } from '../config/cloudinary.js';
import sharp from 'sharp';

/**
 * Upload a file buffer to Cloudinary using an upload_stream, returning the secure URL.
 * @param {object} file - Multer file object containing a Buffer.
 * @param {string} folder - Cloudinary folder to store the file in.
 * @returns {Promise<string>} The uploaded image URL.
 */
export const uploadBufferToCloudinary = async (file, folder = 'Aagaur/projects') => {
  let bufferToUpload = file.buffer;
  // Compress if image larger than 9 MB to stay under Cloudinary free plan 10 MB limit
  // Compress all images larger than ~1 MB to speed up upload and reduce Cloudinary timeouts
  if (file.mimetype.startsWith('image/') && file.size > 1 * 1024 * 1024) {
    try {
      bufferToUpload = await sharp(file.buffer)
        .rotate()
        .resize({ width: 1920 })
        .jpeg({ quality: 80 })
        .toBuffer();
      console.log(`[COMPRESSION] Compressed ${file.originalname} from ${(file.size / 1e6).toFixed(1)}MB to ${(bufferToUpload.length / 1e6).toFixed(1)}MB`);
    } catch (err) {
      console.error('[COMPRESSION] Failed, uploading original buffer', err.message);
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
