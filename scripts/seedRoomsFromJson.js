import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import connectDB from '../config/db.js';
import Room from '../models/Room.js';

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

// Flatten the image array but keep filenames identical to frontend behaviour
const flattenImages = (imageField) => {
  if (!Array.isArray(imageField)) return [];
  const result = [];
  for (const img of imageField) {
    if (typeof img === 'string') {
      // In JSON some entries are "file1.jpg, file2.jpg"
      const parts = img.split(',').map((p) => p.trim()).filter(Boolean);
      result.push(...parts);
    } else {
      // Unexpected structure, keep as-is
      result.push(img);
    }
  }
  return result;
};

const seedRooms = async () => {
  try {
    await connectDB();
    console.log('[SEED ROOMS] Connected to MongoDB');

    const roomsFromJson = loadRoomsJson();
    console.log(`[SEED ROOMS] Found ${roomsFromJson.length} rooms in JSON`);

    for (let index = 0; index < roomsFromJson.length; index++) {
      const r = roomsFromJson[index];

      const name = r.name;
      const slug = r.slug; // keep exactly as in JSON

      if (!name || !slug) {
        console.warn('[SEED ROOMS] Skipping room without name or slug:', r);
        continue;
      }

      // Images: keep filenames, flatten comma-separated entries
      const images = flattenImages(r.image);

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

      const amenities = rawAmenities.map((item) => {
        if (typeof item === 'string') {
          return { label: item };
        }
        if (item && typeof item === 'object') {
          return {
            label: item.label,
            icon: item.icon, // keep icon string exactly, even if frontend doesn’t use it now
          };
        }
        return null;
      }).filter(Boolean);

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
        imagePublicIds: [], // not used for local images; future Cloudinary uploads will fill this
        your_stays_include: yourStaysInclude,
        amenities,
        bath_and_wellness: bathAndWellness,
        // SEO fields: leave undefined for now, admin can fill later
        status: 'published',
        sortOrder: index, // preserve current visual order
      };

      const upserted = await Room.findOneAndUpdate(
        { slug },
        { $set: doc },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      console.log(`[SEED ROOMS] Upserted room: ${upserted.name} (slug: ${upserted.slug})`);
    }

    console.log('[SEED ROOMS] Done.');
  } catch (err) {
    console.error('[SEED ROOMS] Error:', err);
  } finally {
    await mongoose.connection.close();
    console.log('[SEED ROOMS] MongoDB connection closed');
    process.exit(0);
  }
};

seedRooms();


