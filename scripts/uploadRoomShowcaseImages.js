import { uploadImagesBatchToCloudinary } from '../utils/cloudinaryBatchUpload.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function uploadRoomShowcaseImages() {
  try {
    const publicFolder = path.join(__dirname, '../../arboreal-new-frontend/public');
    
    // Room images in exact order as they appear in RoomShowcase.jsx
    const roomImages = [
      { 
        name: 'Classic_Sunroom_1.jpg', 
        roomTitle: 'The Classic Sunroom',
        slug: 'classic-sunroom'
      },
      { 
        name: 'Forest_Bathtub_07.jpg', 
        roomTitle: 'Forest Bathtub Room',
        slug: 'forest-bathtub-room'
      },
      { 
        name: 'Forest_Private_Pool_2.jpg', 
        roomTitle: 'Forest Private Pool Room',
        slug: 'forest-private-pool-room'
      },
      { 
        name: 'Luxury_Sunroom_Arboreal_01.jpg', 
        roomTitle: 'Luxury Sunroom',
        slug: 'luxury-sunroom'
      },
    ];

    // Find existing images (try jpg, png, webp)
    const imagePaths = roomImages.map(room => {
      const jpgPath = path.join(publicFolder, room.name);
      const pngPath = path.join(publicFolder, room.name.replace('.jpg', '.png'));
      const webpPath = path.join(publicFolder, room.name.replace('.jpg', '.webp'));
      
      if (fs.existsSync(jpgPath)) return { path: jpgPath, room };
      if (fs.existsSync(pngPath)) return { path: pngPath, room };
      if (fs.existsSync(webpPath)) return { path: webpPath, room };
      return null;
    }).filter(Boolean);

    console.log(`📸 Uploading ${imagePaths.length} room showcase images to Cloudinary...`);
    console.log('Quality: High (auto:good) - maintaining sharpness\n');

    const pathsOnly = imagePaths.map(item => item.path);
    const results = await uploadImagesBatchToCloudinary(pathsOnly, 'Arboreal/rooms');

    console.log(`\n✅ Successfully uploaded ${results.length} images!\n`);
    console.log('📋 Copy this to RoomShowcase.jsx component (replace the rooms array):\n');
    console.log('const rooms = [');
    
    // Match results with room data in correct order
    imagePaths.forEach((item, index) => {
      const result = results[index];
      if (result) {
        console.log(`  {`);
        console.log(`    id: ${index + 1},`);
        console.log(`    title: "${item.room.roomTitle}",`);
        console.log(`    slug: "${item.room.slug}",`);
        console.log(`    images: ["${result.url}"],`);
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

uploadRoomShowcaseImages();












