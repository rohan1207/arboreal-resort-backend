import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

// Direct Cloudinary credentials
cloudinary.config({
  cloud_name: 'dxevy8mea',
  api_key: '276168121575332',
  api_secret: 'rZ-D_WKPKQkV1Gv7foNWS7DYp-w'
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
        // High quality optimized versions (not too compressed)
        eager: [
          // Desktop version - high quality
          { 
            quality: 'auto:good',
            width: 1920, 
            format: 'mp4'
          },
          // Mobile version - good quality
          { 
            quality: 'auto:good',
            width: 1280, 
            format: 'mp4'
          },
          // WebM version - high quality
          { 
            quality: 'auto:good', 
            width: 1920, 
            format: 'webm'
          }
        ],
        eager_async: true,
        // Note: streaming_profile cannot be used with eager transformations
        // Removed streaming_profile to avoid conflict
        // Removed bit_rate - Cloudinary will auto-calculate based on quality settings
        video_codec: 'auto',
        audio_codec: 'aac',
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        
        const publicId = result.public_id;
        const cloudName = 'dxevy8mea'; // Direct cloud name
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

