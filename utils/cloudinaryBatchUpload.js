import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

// Direct Cloudinary credentials
cloudinary.config({
  cloud_name: 'ddfuu6bop',
  api_key: '417893748926271 ',
  api_secret: 'daYpxdvUO57iyIvyZh3swpDsIQw'
});

/**
 * Upload multiple images to Cloudinary with high-quality optimization
 * @param {Array<string>} imagePaths - Array of local file paths
 * @param {string} folder - Cloudinary folder (e.g., 'Arboreal/slider')
 * @returns {Promise<Array<object>>} Array of upload results with URLs
 */
export const uploadImagesBatchToCloudinary = async (imagePaths, folder = 'Arboreal/slider') => {
  const results = [];
  const cloudName = 'ddfuu6bop'; // Direct cloud name
  const baseUrl = `https://res.cloudinary.com/${cloudName}/image/upload`;

  for (const imagePath of imagePaths) {
    try {
      if (!fs.existsSync(imagePath)) {
        console.log(`⚠️  File not found: ${imagePath}, skipping...`);
        continue;
      }

      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload(
          imagePath,
          {
            folder: folder,
            use_filename: true,
            unique_filename: false,
            overwrite: false,
            // High quality settings (not too compressed)
            quality: 'auto:good',  // Good quality, maintains sharpness
            fetch_format: 'auto',   // Auto WebP/AVIF when supported
            transformation: [
              { 
                width: 1200,        // Higher width for better quality
                quality: 'auto:good', 
                format: 'auto' 
              }
            ]
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
      });

      // Build high-quality optimized URL
      const optimizedUrl = `${baseUrl}/q_auto:good,w_1200,f_auto/${result.public_id}`;
      
      results.push({
        filename: result.original_filename,
        publicId: result.public_id,
        url: optimizedUrl,
        original: result.secure_url
      });

    } catch (error) {
      console.error(`❌ Failed to upload ${imagePath}:`, error.message);
    }
  }

  return results;
};

