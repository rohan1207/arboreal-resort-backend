import { uploadImagesBatchToCloudinary } from '../utils/cloudinaryBatchUpload.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function uploadSliderImages() {
  try {
    const publicFolder = path.join(__dirname, '../../arboreal-new-frontend/public');
    
    const imageNames = [
      'slider5', 'slider6', 'slider7', 'slider8', 'slider9', 'slider10',
      'slider11', 'slider12', 'slider13', 'slider14', 'slider15', 'slider16',
      'slider17', 'slider18', 'slider19', 'slider20', 'slider21', 'slider22',
      'slider23', 'slider24', 'slider25', 'slider26',
    ];

    // Find existing images (try webp, jpg, png)
    const imagePaths = imageNames.map(name => {
      const webpPath = path.join(publicFolder, `${name}.webp`);
      const jpgPath = path.join(publicFolder, `${name}.jpg`);
      const pngPath = path.join(publicFolder, `${name}.png`);
      
      if (fs.existsSync(webpPath)) return webpPath;
      if (fs.existsSync(jpgPath)) return jpgPath;
      if (fs.existsSync(pngPath)) return pngPath;
      return null;
    }).filter(Boolean);

    console.log(`📸 Uploading ${imagePaths.length} slider images to Cloudinary...`);
    console.log('Quality: High (auto:good) - maintaining sharpness\n');

    const results = await uploadImagesBatchToCloudinary(imagePaths, 'Arboreal/slider');

    console.log(`\n✅ Successfully uploaded ${results.length} images!\n`);
    console.log('📋 Copy this array to ImageSlider.jsx component:\n');
    console.log('const cloudinaryImages = [');
    results.forEach((img, index) => {
      console.log(`  { name: '${img.filename}', url: '${img.url}' },`);
    });
    console.log('];');
    console.log('\n💡 Note: Using auto:good quality and 1200px width for sharp, high-quality images');
    
  } catch (error) {
    console.error('❌ Upload failed:', error.message);
    process.exit(1);
  }
}

uploadSliderImages();















