import { uploadImagesBatchToCloudinary } from '../utils/cloudinaryBatchUpload.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function uploadBlogImages() {
  try {
    const publicFolder = path.join(__dirname, '../../arboreal-new-frontend/public');
    
    // Blog images in exact order as they appear in blogsdata.json
    const blogImages = [
      { name: 'blog1.png', blogIndex: 0 },
      { name: 'blog2.jpg', blogIndex: 1 },
      { name: 'blog3.jpg', blogIndex: 2 },
      { name: 'blog4.png', blogIndex: 3 },
      { name: 'blog5.png', blogIndex: 4 },
    ];

    // Find existing images (try png, jpg, webp)
    const imagePaths = blogImages.map(blog => {
      const pngPath = path.join(publicFolder, blog.name);
      const jpgPath = path.join(publicFolder, blog.name.replace('.png', '.jpg'));
      const webpPath = path.join(publicFolder, blog.name.replace('.png', '.webp').replace('.jpg', '.webp'));
      
      if (fs.existsSync(pngPath)) return { path: pngPath, blog };
      if (fs.existsSync(jpgPath)) return { path: jpgPath, blog };
      if (fs.existsSync(webpPath)) return { path: webpPath, blog };
      return null;
    }).filter(Boolean);

    console.log(`📸 Uploading ${imagePaths.length} blog cover images to Cloudinary...`);
    console.log('Quality: High (auto:good) - maintaining sharpness\n');

    const pathsOnly = imagePaths.map(item => item.path);
    const results = await uploadImagesBatchToCloudinary(pathsOnly, 'Arboreal/blogs');

    console.log(`\n✅ Successfully uploaded ${results.length} images!\n`);
    console.log('📋 Update blogsdata.json - replace coverImage paths with these URLs:\n');
    
    // Match results with blog data in correct order
    imagePaths.forEach((item, index) => {
      const result = results[index];
      if (result) {
        console.log(`Blog ${item.blog.blogIndex + 1} (${item.blog.name}):`);
        console.log(`  "coverImage": "${result.url}",`);
        console.log('');
      }
    });
    console.log('💡 Note: Using auto:good quality and 1200px width for sharp, high-quality images');
    console.log('💡 Copy the coverImage URLs above and update blogsdata.json accordingly');
    
  } catch (error) {
    console.error('❌ Upload failed:', error.message);
    process.exit(1);
  }
}

uploadBlogImages();












