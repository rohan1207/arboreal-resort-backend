import { v2 as cloudinary } from 'cloudinary';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Models
import HomeSettings from '../models/HomeSettings.js';
import AboutSettings from '../models/AboutSettings.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the parent directory (project root)
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Configure Cloudinary with explicit credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'ddfuu6bop',
  api_key: process.env.CLOUDINARY_API_KEY || '417893748926271',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'daYpxdvUO57iyIvyZh3swpDsIQw',
});

console.log('[MIGRATION] Cloudinary configured with:');
console.log(`  Cloud Name: ${cloudinary.config().cloud_name}`);
console.log(`  API Key: ${cloudinary.config().api_key?.substring(0, 10)}...`);

// Path to frontend public folder
const publicFolder = path.join(__dirname, '../../arboreal-new-frontend/public');

// Old Cloudinary cloud name
const OLD_CLOUD_NAME = 'dxevy8mea';
const NEW_CLOUD_NAME = 'ddfuu6bop';

/**
 * Extract filename from Cloudinary URL
 */
const extractFilenameFromUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  
  try {
    // Extract public_id from URL
    // Format: https://res.cloudinary.com/{cloud_name}/image/upload/{transformations}/{public_id}
    const match = url.match(/\/v\d+\/(.+)$/);
    if (match) {
      const publicId = match[1];
      // Remove folder path and get just the filename
      const parts = publicId.split('/');
      return parts[parts.length - 1];
    }
    
    // Try to extract from simpler format
    const simpleMatch = url.match(/\/([^\/]+\.(jpg|jpeg|png|webp|gif|mp4|mov))$/i);
    if (simpleMatch) {
      return simpleMatch[1];
    }
    
    return null;
  } catch (err) {
    return null;
  }
};

/**
 * Find local file matching the filename
 */
const findLocalFile = (filename) => {
  if (!filename) return null;
  
  const extensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.mp4', '.mov', '.JPG', '.JPEG', '.PNG', '.WEBP'];
  const baseName = filename.replace(/\.[^.]+$/, ''); // Remove extension
  
  // Search in public folder and subfolders
  const searchPaths = [
    publicFolder,
    path.join(publicFolder, 'Gallery'),
    path.join(publicFolder, 'rooms'),
  ];
  
  for (const searchPath of searchPaths) {
    if (!fs.existsSync(searchPath)) continue;
    
    // Try exact filename match
    for (const ext of extensions) {
      const filePath = path.join(searchPath, filename);
      if (fs.existsSync(filePath)) {
        return filePath;
      }
      
      // Try with different extension
      const altPath = path.join(searchPath, baseName + ext);
      if (fs.existsSync(altPath)) {
        return altPath;
      }
    }
    
    // Search in subdirectories
    try {
      const files = fs.readdirSync(searchPath, { recursive: true });
      for (const file of files) {
        const filePath = path.join(searchPath, file);
        if (fs.statSync(filePath).isFile()) {
          const fileBaseName = path.basename(file, path.extname(file));
          if (fileBaseName.toLowerCase() === baseName.toLowerCase()) {
            return filePath;
          }
        }
      }
    } catch (err) {
      // Skip if can't read directory
    }
  }
  
  return null;
};

/**
 * Upload file to new Cloudinary account
 */
const uploadToNewCloudinary = async (filePath, folder) => {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    
    const isVideo = /\.(mp4|mov|webm)$/i.test(filePath);
    
    const uploadOptions = {
      folder: folder,
      resource_type: isVideo ? 'video' : 'image',
      use_filename: true,
      unique_filename: false,
      overwrite: false,
    };

    // For videos, upload without transformations (let Cloudinary process on-demand)
    // This prevents "Video is too large to process synchronously" errors
    if (!isVideo) {
      uploadOptions.quality = 'auto:good';
      uploadOptions.fetch_format = 'auto';
    }

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        filePath,
        uploadOptions,
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
    });
    
    if (isVideo) {
      const baseUrl = `https://res.cloudinary.com/${NEW_CLOUD_NAME}/video/upload`;
      return {
        url: result.secure_url,
        posterUrl: `${baseUrl}/q_auto:good,so_1/${result.public_id}.jpg`,
        publicId: result.public_id,
      };
    } else {
      const baseUrl = `https://res.cloudinary.com/${NEW_CLOUD_NAME}/image/upload`;
      return {
        url: `${baseUrl}/q_auto:good,w_1200,f_auto/${result.public_id}`,
        publicId: result.public_id,
      };
    }
  } catch (error) {
    console.error(`  ❌ Upload failed: ${error.message}`);
    return null;
  }
};

/**
 * Check if URL contains old Cloudinary domain
 */
const isOldCloudinaryUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  return url.includes(OLD_CLOUD_NAME);
};


/**
 * Migrate HomeSettings - Only Hero Video
 */
const migrateHomeSettings = async () => {
  console.log('\n🏠 Migrating HomeSettings (Hero Video only)...');
  const settings = await HomeSettings.getSettings();
  
  let updated = 0;
  let skipped = 0;
  let failed = 0;
  
  // Migrate hero video only
  if (settings.heroVideoUrl && isOldCloudinaryUrl(settings.heroVideoUrl)) {
    console.log('  Processing hero video...');
    const filename = extractFilenameFromUrl(settings.heroVideoUrl);
    const localFile = findLocalFile(filename) || path.join(publicFolder, 'YOUTUBE.mp4');
    
    if (fs.existsSync(localFile)) {
      const uploadResult = await uploadToNewCloudinary(localFile, 'Arboreal/hero');
      if (uploadResult) {
        settings.heroVideoUrl = uploadResult.url;
        if (uploadResult.posterUrl) {
          settings.heroPosterUrl = uploadResult.posterUrl;
        }
        updated++;
        console.log('  ✅ Updated hero video');
      } else {
        failed++;
      }
    } else {
      failed++;
      console.log(`  ⚠️  Hero video file not found at: ${localFile}`);
    }
  } else if (settings.heroVideoUrl) {
    skipped++;
    console.log('  ⏭️  Hero video URL is already using new Cloudinary account');
  } else {
    skipped++;
    console.log('  ⏭️  No hero video URL found');
  }
  
  if (updated > 0) {
    await settings.save();
    console.log(`  ✅ Saved updated HomeSettings to database`);
  }
  
  return { updated, skipped, failed };
};

/**
 * Migrate AboutSettings - Only Card Images (2 images)
 */
const migrateAboutSettings = async () => {
  console.log('\n📄 Migrating AboutSettings (Card Images only)...');
  const settings = await AboutSettings.getSettings();
  
  let updated = 0;
  let skipped = 0;
  let failed = 0;
  
  // Ensure we have at least 2 cards
  if (!settings.cards || settings.cards.length < 2) {
    while (settings.cards.length < 2) {
      settings.cards.push({
        title: '',
        subtitle: '',
        description1: '',
        description2: '',
        imageUrl: '',
      });
    }
  }
  
  // Migrate card 1 image - use ac.png from public folder
  if (settings.cards[0]) {
    console.log('  Processing card 1 image...');
    const localFile = path.join(publicFolder, 'ac.png');
    
    if (fs.existsSync(localFile)) {
      const uploadResult = await uploadToNewCloudinary(localFile, 'Arboreal/about/cards');
      if (uploadResult) {
        settings.cards[0].imageUrl = uploadResult.url;
        updated++;
        console.log('  ✅ Updated card 1 image (ac.png)');
      } else {
        failed++;
      }
    } else {
      failed++;
      console.log(`  ⚠️  File not found: ${localFile}`);
    }
  }
  
  // Migrate card 2 image - use ac2.webp from public folder
  if (settings.cards[1]) {
    console.log('  Processing card 2 image...');
    const localFile = path.join(publicFolder, 'ac2.webp');
    
    if (fs.existsSync(localFile)) {
      const uploadResult = await uploadToNewCloudinary(localFile, 'Arboreal/about/cards');
      if (uploadResult) {
        settings.cards[1].imageUrl = uploadResult.url;
        updated++;
        console.log('  ✅ Updated card 2 image (ac2.webp)');
      } else {
        failed++;
      }
    } else {
      failed++;
      console.log(`  ⚠️  File not found: ${localFile}`);
    }
  }
  
  if (updated > 0) {
    await settings.save();
    console.log(`  ✅ Saved updated AboutSettings to database`);
  }
  
  return { updated, skipped, failed };
};

/**
 * Main migration function
 */
const migrateAll = async () => {
  try {
    console.log('🚀 Starting Cloudinary URL Migration...');
    console.log(`📁 Public folder: ${publicFolder}`);
    console.log(`🔄 Migrating from: ${OLD_CLOUD_NAME} → ${NEW_CLOUD_NAME}\n`);
    
    // Check if MONGODB_URI is set
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables. Please set it in your .env file.');
    }
    
    // Connect to MongoDB
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log(`✅ Connected to MongoDB: ${mongoose.connection.host}\n`);
    } catch (error) {
      throw new Error(`Failed to connect to MongoDB: ${error.message}. Please check your MONGODB_URI and ensure MongoDB is running.`);
    }
    
    const results = {
      home: { updated: 0, skipped: 0, failed: 0 },
      about: { updated: 0, skipped: 0, failed: 0 },
    };
    
    // Run migrations - Only Home Hero Video and About Page Images
    results.home = await migrateHomeSettings();
    results.about = await migrateAboutSettings();
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    
    const totalUpdated = Object.values(results).reduce((sum, r) => sum + r.updated, 0);
    const totalSkipped = Object.values(results).reduce((sum, r) => sum + r.skipped, 0);
    const totalFailed = Object.values(results).reduce((sum, r) => sum + r.failed, 0);
    
    console.log('\nHomeSettings (Hero Video):');
    console.log(`  ✅ Updated: ${results.home.updated}`);
    console.log(`  ⏭️  Skipped: ${results.home.skipped}`);
    console.log(`  ❌ Failed: ${results.home.failed}`);
    
    console.log('\nAboutSettings (Card Images):');
    console.log(`  ✅ Updated: ${results.about.updated}`);
    console.log(`  ⏭️  Skipped: ${results.about.skipped}`);
    console.log(`  ❌ Failed: ${results.about.failed}`);
    
    console.log('\n' + '='.repeat(60));
    console.log('TOTALS:');
    console.log(`  ✅ Updated: ${totalUpdated}`);
    console.log(`  ⏭️  Skipped: ${totalSkipped}`);
    console.log(`  ❌ Failed: ${totalFailed}`);
    console.log('='.repeat(60));
    
    if (totalFailed > 0) {
      console.log('\n⚠️  Some URLs could not be migrated because local files were not found.');
      console.log('   You may need to manually upload these images through the admin panel.');
    }
    
    console.log('\n🎉 Migration completed!\n');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
    process.exit(0);
  }
};

// Run migration
migrateAll();

