import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

// Direct Cloudinary credentials
cloudinary.config({
  cloud_name: 'ddfuu6bop',
  api_key: 'daYpxdvUO57iyIvyZh3swpDsIQw',
  api_secret: '417893748926271'
});

/**
 * Upload video file to Cloudinary with high-quality optimization
 * @param {string} filePath - Local path to video file
 * @param {string} folder - Cloudinary folder (e.g., 'Arboreal/hero')
 * @returns {Promise<object>} Upload result with optimized URLs
 */
export const uploadVideoToCloudinary = async (filePath, folder = 'Arboreal/hero') => {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filePath)) {
      return reject(new Error(`File not found: ${filePath}`));
    }

    cloudinary.uploader.upload(
      filePath,
      {
        resource_type: 'video',
        folder: folder,
        use_filename: true,
        unique_filename: false,
        overwrite: false,
        // Upload original video only.
        // IMPORTANT: Do not request any transformations during upload for large files,
        // otherwise Cloudinary may try to process them synchronously and fail with
        // "Video is too large to process synchronously" errors.
        //
        // We keep transformation work purely in the *delivery* URLs below so that
        // Cloudinary can generate and cache derivatives lazily when first requested.
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        
        const publicId = result.public_id;
        const cloudName = 'ddfuu6bop'; // Direct cloud name
        const baseUrl = `https://res.cloudinary.com/${cloudName}/video/upload`;
        
        // Build high-quality optimized URLs
        const urls = {
          publicId: publicId,
          // Desktop - high quality
          desktop: `${baseUrl}/q_auto:good,w_1920,f_auto/${publicId}.mp4`,
          // Mobile - good quality (not too compressed)
          mobile: `${baseUrl}/q_auto:good,w_1280,f_auto/${publicId}.mp4`,
          // WebM version - high quality
          webm: `${baseUrl}/q_auto:good,w_1920,f_webm/${publicId}.mp4`,
          // Poster (first frame) - high quality
          poster: `${baseUrl}/q_auto:good,so_1/${publicId}.jpg`,
        };
        
        resolve({
          ...result,
          urls
        });
      }
    );
  });
};

