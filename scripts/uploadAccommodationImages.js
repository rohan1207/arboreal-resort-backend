import { uploadImagesBatchToCloudinary } from '../utils/cloudinaryBatchUpload.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function uploadAccommodationImages() {
  try {
    const publicFolder = path.join(__dirname, '../../arboreal-new-frontend/public');
    
    // Accommodation images in exact order as they appear in AccommodationCards.jsx
    const accommodationImages = [
      { 
        name: 'ac2.webp', 
        title: 'The Tree-House Resort',
        category: 'ACCOMMODATION',
        description: 'Our elevated structures bring you to the treetops of the valley, offering an unparalleled experience akin to the best tree house in Lonavala. With the lush green rainforest as your backdrop, the view is truly mesmerizing and calming.'
      },
      { 
        name: 'ac.png', 
        title: 'The Amazing Nature',
        category: 'ACCOMMODATION',
        description: 'Our elevated structures bring you to the treetops of the valley, offering an unparalleled experience akin to the best tree house in Lonavala. With the lush green rainforest as your backdrop, the view is truly mesmerizing and calming.'
      },
    ];

    // Find existing images (try webp, png, jpg)
    const imagePaths = accommodationImages.map(acc => {
      const webpPath = path.join(publicFolder, acc.name);
      const pngPath = path.join(publicFolder, acc.name.replace('.webp', '.png').replace('ac2', 'ac2'));
      const jpgPath = path.join(publicFolder, acc.name.replace('.webp', '.jpg').replace('.png', '.jpg'));
      
      if (fs.existsSync(webpPath)) return { path: webpPath, acc };
      if (fs.existsSync(pngPath)) return { path: pngPath, acc };
      if (fs.existsSync(jpgPath)) return { path: jpgPath, acc };
      return null;
    }).filter(Boolean);

    console.log(`📸 Uploading ${imagePaths.length} accommodation images to Cloudinary...`);
    console.log('Quality: High (auto:good) - maintaining sharpness\n');

    const pathsOnly = imagePaths.map(item => item.path);
    const results = await uploadImagesBatchToCloudinary(pathsOnly, 'Arboreal/accommodation');

    console.log(`\n✅ Successfully uploaded ${results.length} images!\n`);
    console.log('📋 Copy this to AccommodationCards.jsx component (replace the accommodations array):\n');
    console.log('const accommodations = [');
    
    // Match results with accommodation data in correct order
    imagePaths.forEach((item, index) => {
      const result = results[index];
      if (result) {
        console.log(`  {`);
        console.log(`    id: ${index + 1},`);
        console.log(`    image: "${result.url}",`);
        console.log(`    category: "${item.acc.category}",`);
        console.log(`    title: "${item.acc.title}",`);
        console.log(`    description: "${item.acc.description}",`);
        console.log(`  },`);
      }
    });
    console.log('];');
    console.log('\n💡 Note: Using auto:good quality and 1200px width for sharp, high-quality images');
    
  } catch (error) {
    console.error('❌ Upload failed:', error.message);
    process.exit(1);
  }
}

uploadAccommodationImages();































