import { uploadImagesBatchToCloudinary } from '../utils/cloudinaryBatchUpload.js';
import GallerySettings from '../models/GallerySettings.js';
import connectDB from '../config/db.js';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seedGalleryImages() {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    // Path to the Gallery folder
    const galleryFolder = path.join(__dirname, '../../arboreal-new-frontend/public/Gallery');
    
    if (!fs.existsSync(galleryFolder)) {
      throw new Error(`Gallery folder not found at: ${galleryFolder}`);
    }

    // Read all files from the Gallery folder
    console.log(`📂 Reading images from: ${galleryFolder}`);
    const files = fs.readdirSync(galleryFolder);
    
    // Filter only image files (webp, jpg, jpeg, png)
    const imageExtensions = ['.webp', '.jpg', '.jpeg', '.png', '.JPG', '.JPEG', '.PNG', '.WEBP'];
    const imageFiles = files.filter(file => {
      const ext = path.extname(file);
      return imageExtensions.includes(ext);
    });

    if (imageFiles.length === 0) {
      throw new Error('No image files found in the Gallery folder');
    }

    console.log(`📸 Found ${imageFiles.length} images to upload\n`);

    // Create full paths for all images
    const imagePaths = imageFiles.map(file => path.join(galleryFolder, file));

    // Upload all images to Cloudinary
    console.log('☁️  Uploading images to Cloudinary...');
    console.log('   Folder: Arboreal/gallery');
    console.log('   Quality: High (auto:good) - maintaining sharpness\n');

    const uploadResults = await uploadImagesBatchToCloudinary(imagePaths, 'Arboreal/gallery');

    if (uploadResults.length === 0) {
      throw new Error('No images were successfully uploaded to Cloudinary');
    }

    console.log(`\n✅ Successfully uploaded ${uploadResults.length} images to Cloudinary!\n`);

    // Get or create GallerySettings document
    console.log('📋 Fetching GallerySettings from database...');
    const settings = await GallerySettings.getSettings();

    // Check for existing images to avoid duplicates
    const existingUrls = new Set(settings.images.map(img => img.url));
    const existingCount = existingUrls.size;
    console.log(`   Found ${existingCount} existing images in database\n`);

    // Prepare image objects for database (only new ones)
    const newImages = uploadResults
      .filter(result => !existingUrls.has(result.url))
      .map(result => {
        // Extract a clean alt text from filename (remove extension, replace underscores/hyphens with spaces)
        const altText = path.parse(result.filename).name
          .replace(/[_-]/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase()); // Capitalize first letter of each word

        return {
          url: result.url,
          alt: altText
        };
      });

    if (newImages.length === 0) {
      console.log('⚠️  All images already exist in the database. No new images to add.\n');
      await mongoose.connection.close();
      process.exit(0);
    }

    // Add new images to existing images array
    settings.images.push(...newImages);
    await settings.save();

    console.log(`✅ Successfully added ${newImages.length} images to GallerySettings!`);
    console.log(`📊 Total images in gallery: ${settings.images.length}\n`);

    // Display summary
    console.log('📋 Uploaded Images Summary:');
    console.log('─'.repeat(60));
    newImages.forEach((img, index) => {
      console.log(`${index + 1}. ${img.alt}`);
      console.log(`   URL: ${img.url}`);
    });
    console.log('─'.repeat(60));
    console.log('\n🎉 Gallery seeding completed successfully!\n');

    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Gallery seeding failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the seeding script
seedGalleryImages();

