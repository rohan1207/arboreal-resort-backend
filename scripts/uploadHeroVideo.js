import { uploadVideoToCloudinary } from '../utils/cloudinaryVideoUpload.js';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function uploadHeroVideo() {
  try {
    const videoPath = path.join(__dirname, '../../arboreal-new-frontend/public/YOUTUBE.mp4');
    
    console.log('📹 Uploading hero video to Cloudinary...');
    console.log('Video path:', videoPath);
    console.log('Quality: High (auto:good) - maintaining sharpness\n');
    
    const result = await uploadVideoToCloudinary(videoPath, 'Arboreal/hero');
    
    console.log('\n✅ Video uploaded successfully!\n');
    console.log('📋 Copy these URLs to Hero.jsx component:\n');
    console.log('// Cloudinary Video URLs (High Quality)');
    console.log(`const CLOUDINARY_VIDEO_DESKTOP = '${result.urls.desktop}';`);
    console.log(`const CLOUDINARY_VIDEO_MOBILE = '${result.urls.mobile}';`);
    console.log(`const CLOUDINARY_VIDEO_WEBM = '${result.urls.webm}';`);
    console.log(`const CLOUDINARY_VIDEO_POSTER = '${result.urls.poster}';`);
    console.log('\nPublic ID:', result.publicId);
    console.log('\n💡 Note: Using auto:good quality to maintain sharpness while optimizing file size');
    
  } catch (error) {
    console.error('❌ Upload failed:', error.message);
    process.exit(1);
  }
}

uploadHeroVideo();































