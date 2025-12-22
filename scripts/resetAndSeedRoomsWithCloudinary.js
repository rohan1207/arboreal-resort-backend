import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import connectDB from '../config/db.js';
import Room from '../models/Room.js';
import { cloudinary } from '../config/cloudinary.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to frontend rooms JSON (do NOT modify this file, only read)
const roomsJsonPath = path.join(
  __dirname,
  '../..',
  'arboreal-new-frontend',
  'src',
  'Data',
  'roomsdata.json'
);

// Path to frontend public folder (where the room images live today)
const frontendPublicPath = path.join(
  __dirname,
  '../..',
  'arboreal-new-frontend',
  'public'
);

const loadRoomsJson = () => {
  if (!fs.existsSync(roomsJsonPath)) {
    throw new Error(`roomsdata.json not found at: ${roomsJsonPath}`);
  }
  const raw = fs.readFileSync(roomsJsonPath, 'utf-8');
  const parsed = JSON.parse(raw);
  if (!parsed || !Array.isArray(parsed.ResortRooms)) {
    throw new Error('Invalid roomsdata.json format: expected { "ResortRooms": [...] }');
  }
  return parsed.ResortRooms;
};

// Flatten the image array into individual filenames (exactly how frontend expects)
const flattenImageFilenames = (imageField) => {
  if (!Array.isArray(imageField)) return [];
  const result = [];
  for (const img of imageField) {
    if (typeof img === 'string') {
      const parts = img.split(',').map((p) => p.trim()).filter(Boolean);
      result.push(...parts);
    } else {
      result.push(img);
    }
  }
  return result;
};

const uploadLocalImageToCloudinary = async (filename) => {
  const localPath = path.join(frontendPublicPath, filename);
  if (!fs.existsSync(localPath)) {
    console.warn(`[SEED ROOMS + CLOUDINARY] Local image not found, skipping: ${localPath}`);
    return null;
  }

  try {
    const result = await cloudinary.uploader.upload(localPath, {
      folder: 'Arboreal/rooms',
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
    console.error('[SEED ROOMS + CLOUDINARY] Failed to upload image:', filename, err.message);
    return null;
  }
};

const resetAndSeedRooms = async () => {
  try {
    await connectDB();
    console.log('[SEED ROOMS + CLOUDINARY] Connected to MongoDB');

    // 1) Wipe existing Room documents (as requested)
    const removed = await Room.deleteMany({});
    console.log(`[SEED ROOMS + CLOUDINARY] Deleted ${removed.deletedCount} existing rooms`);

    const roomsFromJson = loadRoomsJson();
    console.log(`[SEED ROOMS + CLOUDINARY] Found ${roomsFromJson.length} rooms in JSON`);

    for (let index = 0; index < roomsFromJson.length; index++) {
      const r = roomsFromJson[index];

      const name = r.name;
      const slug = r.slug; // keep exactly as in JSON

      if (!name || !slug) {
        console.warn('[SEED ROOMS + CLOUDINARY] Skipping room without name or slug:', r);
        continue;
      }

      // Images: flatten filenames, then upload each to Cloudinary
      const filenames = flattenImageFilenames(r.image);
      const images = [];
      const imagePublicIds = [];

      for (const filename of filenames) {
        const uploaded = await uploadLocalImageToCloudinary(filename);
        if (uploaded) {
          images.push(uploaded.url);
          imagePublicIds.push(uploaded.publicId);
        }
      }

      if (!images.length) {
        console.warn(`[SEED ROOMS + CLOUDINARY] No images uploaded for room: ${name}`);
      }

      // Your stays include: copy verbatim
      const yourStaysInclude = Array.isArray(r.your_stays_include)
        ? r.your_stays_include.slice()
        : [];

      // Amenities: handle both "amenities" and " amenities" keys, copy labels/icons exactly
      const rawAmenities = Array.isArray(r.amenities)
        ? r.amenities
        : Array.isArray(r[' amenities'])
        ? r[' amenities']
        : [];

      const amenities = rawAmenities
        .map((item) => {
          if (typeof item === 'string') {
            return { label: item };
          }
          if (item && typeof item === 'object') {
            return {
              label: item.label,
              icon: item.icon,
            };
          }
          return null;
        })
        .filter(Boolean);

      // Bath & wellness: copy verbatim
      const bathAndWellness = Array.isArray(r.bath_and_wellness)
        ? r.bath_and_wellness.slice()
        : Array.isArray(r['bath_and_wellness'])
        ? r['bath_and_wellness'].slice()
        : [];

      const doc = {
        name,
        slug,
        description: r.description,
        experience: r.experience,
        images,
        imagePublicIds,
        your_stays_include: yourStaysInclude,
        amenities,
        bath_and_wellness: bathAndWellness,
        status: 'published',
        sortOrder: index,
      };

      const created = await Room.create(doc);
      console.log(`[SEED ROOMS + CLOUDINARY] Created room: ${created.name} (slug: ${created.slug})`);
    }

    console.log('[SEED ROOMS + CLOUDINARY] Done.');
  } catch (err) {
    console.error('[SEED ROOMS + CLOUDINARY] Error:', err);
  } finally {
    await mongoose.connection.close();
    console.log('[SEED ROOMS + CLOUDINARY] MongoDB connection closed');
    process.exit(0);
  }
};

resetAndSeedRooms();


