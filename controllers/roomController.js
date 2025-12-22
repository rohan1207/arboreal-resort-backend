import Room from '../models/Room.js';
import { uploadBufferToCloudinary } from '../utils/cloudinaryUpload.js';
import { deleteByUrl } from '../utils/cloudinaryDelete.js';

// Helper to parse arrays from JSON/form-data
const parseArrayField = (field) => {
  if (!field) return [];
  if (Array.isArray(field)) return field;
  if (typeof field === 'string') {
    try {
      const parsed = JSON.parse(field);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return field.split(',').map((item) => item.trim()).filter(Boolean);
    }
  }
  return [];
};

// PUBLIC: Get all published rooms, sorted
export const getRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ status: 'published' }).sort({ sortOrder: 1, createdAt: 1 });

    // Map to match existing frontend shape (roomsdata.json)
    const mapped = rooms.map((room) => ({
      name: room.name,
      slug: room.slug,
      image: room.images || [],
      description: room.description,
      experience: room.experience,
      your_stays_include: room.your_stays_include || [],
      amenities: room.amenities && room.amenities.length
        ? room.amenities.map((a) => ({ label: a.label, icon: a.icon || '' }))
        : [],
      bath_and_wellness: room.bath_and_wellness || [],
      metaTitle: room.metaTitle,
      metaDescription: room.metaDescription,
      seoKeywords: room.seoKeywords,
      canonicalUrl: room.canonicalUrl,
    }));

    res.json({
      success: true,
      rooms: mapped,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching rooms',
      error: error.message,
    });
  }
};

// ADMIN: Get all rooms (including drafts)
export const getAdminRooms = async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status) query.status = status;

    const rooms = await Room.find(query).sort({ sortOrder: 1, createdAt: 1 });

    res.json({
      success: true,
      rooms,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching rooms',
      error: error.message,
    });
  }
};

// ADMIN: Get single room by ID
export const getAdminRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found',
      });
    }
    res.json({
      success: true,
      room,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching room',
      error: error.message,
    });
  }
};

// ADMIN: Create room
export const createRoom = async (req, res) => {
  try {
    const {
      name,
      slug,
      description,
      experience,
      your_stays_include,
      amenities,
      bath_and_wellness,
      metaTitle,
      metaDescription,
      seoKeywords,
      canonicalUrl,
      status,
      sortOrder,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ success: false, message: 'Description is required' });
    }

    // Handle image uploads (multiple images)
    let images = [];
    let imagePublicIds = [];
    if (req.files && req.files.images && req.files.images.length) {
      for (const file of req.files.images) {
        const url = await uploadBufferToCloudinary(file, 'Arboreal/rooms');
        images.push(url);
        imagePublicIds.push(url); // We use URL with deleteByUrl later
      }
    }

    const amenitiesArray = parseArrayField(amenities).map((label) =>
      typeof label === 'string' ? { label } : label
    );

    const room = await Room.create({
      name,
      slug: slug && slug.trim() ? slug.trim().toLowerCase() : undefined,
      description,
      experience,
      images,
      imagePublicIds,
      your_stays_include: parseArrayField(your_stays_include),
      amenities: amenitiesArray,
      bath_and_wellness: parseArrayField(bath_and_wellness),
      metaTitle,
      metaDescription,
      seoKeywords: parseArrayField(seoKeywords),
      canonicalUrl,
      status: status || 'published',
      sortOrder: sortOrder || 0,
    });

    res.status(201).json({
      success: true,
      message: 'Room created successfully',
      room,
    });
  } catch (error) {
    console.error('[CREATE ROOM] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating room',
      error: error.message,
    });
  }
};

// ADMIN: Update room
export const updateRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found',
      });
    }

    const {
      name,
      description,
      experience,
      your_stays_include,
      amenities,
      bath_and_wellness,
      metaTitle,
      metaDescription,
      seoKeywords,
      canonicalUrl,
      status,
      sortOrder,
    } = req.body;

    if (name) room.name = name;
    if (description) room.description = description;
    if (experience) room.experience = experience;
    if (typeof sortOrder !== 'undefined') room.sortOrder = sortOrder;
    if (status) room.status = status;

    if (your_stays_include) {
      room.your_stays_include = parseArrayField(your_stays_include);
    }

    if (amenities) {
      const amenitiesArray = parseArrayField(amenities).map((label) =>
        typeof label === 'string' ? { label } : label
      );
      room.amenities = amenitiesArray;
    }

    if (bath_and_wellness) {
      room.bath_and_wellness = parseArrayField(bath_and_wellness);
    }

    if (metaTitle) room.metaTitle = metaTitle;
    if (metaDescription) room.metaDescription = metaDescription;
    if (seoKeywords) room.seoKeywords = parseArrayField(seoKeywords);
    if (canonicalUrl) room.canonicalUrl = canonicalUrl;

    // Handle image updates
    if (req.files && req.files.images && req.files.images.length) {
      // Delete old images
      if (room.images && room.images.length) {
        for (const url of room.images) {
          try {
            await deleteByUrl(url);
          } catch (err) {
            console.error('[UPDATE ROOM] Failed to delete old image:', err.message);
          }
        }
      }

      const newImages = [];
      const newPublicIds = [];
      for (const file of req.files.images) {
        const url = await uploadBufferToCloudinary(file, 'Arboreal/rooms');
        newImages.push(url);
        newPublicIds.push(url);
      }
      room.images = newImages;
      room.imagePublicIds = newPublicIds;
    }

    await room.save();

    res.json({
      success: true,
      message: 'Room updated successfully',
      room,
    });
  } catch (error) {
    console.error('[UPDATE ROOM] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating room',
      error: error.message,
    });
  }
};

// ADMIN: Delete room
export const deleteRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found',
      });
    }

    if (room.images && room.images.length) {
      for (const url of room.images) {
        try {
          await deleteByUrl(url);
        } catch (err) {
          console.error('[DELETE ROOM] Failed to delete image:', err.message);
        }
      }
    }

    await Room.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Room deleted successfully',
    });
  } catch (error) {
    console.error('[DELETE ROOM] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting room',
      error: error.message,
    });
  }
};


