import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import connectDB from '../config/db.js';
import Activity from '../models/Activity.js';
import { cloudinary } from '../config/cloudinary.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to frontend activities data file
const activitiesDataPath = path.join(
  __dirname,
  '../..',
  'arboreal-new-frontend',
  'src',
  'Data',
  'Enhance_your_stay_data.js'
);

// Path to frontend public folder (where the activity images live)
const frontendPublicPath = path.join(
  __dirname,
  '../..',
  'arboreal-new-frontend',
  'public'
);

// Read activities from the frontend data file
const loadActivitiesData = () => {
  if (!fs.existsSync(activitiesDataPath)) {
    throw new Error(`Enhance_your_stay_data.js not found at: ${activitiesDataPath}`);
  }
  
  // Read the file and extract the activities array
  const fileContent = fs.readFileSync(activitiesDataPath, 'utf-8');
  
  // Extract the activities array using regex
  const match = fileContent.match(/export const ENHANCE_YOUR_STAY_ACTIVITIES = (\[[\s\S]*?\]);/);
  if (!match) {
    throw new Error('Could not parse activities from Enhance_your_stay_data.js');
  }
  
  // Evaluate the array (safe since it's our own file)
  const activities = eval(match[1]);
  return activities;
};

// Upload a single image to Cloudinary
const uploadImageToCloudinary = async (filename) => {
  // Try different extensions
  const extensions = ['', '.jpg', '.jpeg', '.png', '.webp', '.avif'];
  let localPath = null;
  
  for (const ext of extensions) {
    const testPath = path.join(frontendPublicPath, filename + ext);
    if (fs.existsSync(testPath)) {
      localPath = testPath;
      break;
    }
  }
  
  if (!localPath) {
    // Try with the filename as-is (might already have extension)
    const directPath = path.join(frontendPublicPath, filename);
    if (fs.existsSync(directPath)) {
      localPath = directPath;
    } else {
      console.warn(`[PUSH ACTIVITIES] Image not found, skipping: ${filename}`);
      return null;
    }
  }

  try {
    const result = await cloudinary.uploader.upload(localPath, {
      folder: 'Arboreal/activities',
      use_filename: true,
      unique_filename: false,
      overwrite: false,
      resource_type: 'image',
    });
    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (err) {
    console.error(`[PUSH ACTIVITIES] Failed to upload ${filename}:`, err.message);
    return null;
  }
};

// Push activities to backend
const pushActivitiesToBackend = async () => {
  try {
    await connectDB();
    console.log('[PUSH ACTIVITIES] Connected to MongoDB');

    const activitiesFromFile = loadActivitiesData();
    console.log(`[PUSH ACTIVITIES] Found ${activitiesFromFile.length} activities in data file`);

    // Check if activities already exist
    const existingCount = await Activity.countDocuments();
    if (existingCount > 0) {
      console.log(`[PUSH ACTIVITIES] Warning: ${existingCount} activities already exist in database.`);
      console.log('[PUSH ACTIVITIES] This script will create new activities. Existing ones will remain.');
      console.log('[PUSH ACTIVITIES] If you want to replace them, delete existing activities first.\n');
    }

    for (let index = 0; index < activitiesFromFile.length; index++) {
      const activityData = activitiesFromFile[index];
      const { id, name, price, images, description } = activityData;

      console.log(`\n[PUSH ACTIVITIES] Processing: ${name} (${id})`);

      // Upload images to Cloudinary
      const uploadedImages = [];
      if (images && Array.isArray(images)) {
        console.log(`[PUSH ACTIVITIES] Uploading ${images.length} images...`);
        for (const imagePath of images) {
          // Remove leading slash if present
          const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
          const uploaded = await uploadImageToCloudinary(cleanPath);
          if (uploaded) {
            uploadedImages.push(uploaded.url);
            console.log(`[PUSH ACTIVITIES] ✓ Uploaded: ${cleanPath} -> ${uploaded.url}`);
          }
        }
      }

      if (uploadedImages.length === 0) {
        console.warn(`[PUSH ACTIVITIES] ⚠️  No images uploaded for ${name}, skipping...`);
        continue;
      }

      // Check if activity with same name already exists
      const existing = await Activity.findOne({ name: name.trim() });
      if (existing) {
        console.log(`[PUSH ACTIVITIES] ⚠️  Activity "${name}" already exists, skipping...`);
        continue;
      }

      // Create activity in database
      const activity = await Activity.create({
        name: name.trim(),
        description: description.trim(),
        price: Number(price) || 0,
        images: uploadedImages,
        isActive: true,
        displayOrder: index,
      });

      console.log(`[PUSH ACTIVITIES] ✅ Created activity: ${activity.name} (ID: ${activity._id})`);
    }

    console.log('\n[PUSH ACTIVITIES] ✅ All activities processed successfully!');
    console.log(`[PUSH ACTIVITIES] Total activities in database: ${await Activity.countDocuments()}`);
    
    process.exit(0);
  } catch (error) {
    console.error('[PUSH ACTIVITIES] ❌ Error:', error);
    process.exit(1);
  }
};

pushActivitiesToBackend();




















