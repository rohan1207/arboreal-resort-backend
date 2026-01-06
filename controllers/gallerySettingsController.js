import GallerySettings from '../models/GallerySettings.js';
import { uploadBufferToCloudinary } from '../utils/cloudinaryUpload.js';
import { deleteByUrl } from '../utils/cloudinaryDelete.js';

// @desc    Get gallery settings (admin)
// @route   GET /api/admin/gallery
// @access  Private (Admin)
export const getGallerySettings = async (req, res) => {
  try {
    const settings = await GallerySettings.getSettings();
    res.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error('[GET GALLERY SETTINGS] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching gallery settings',
      error: error.message,
    });
  }
};

// @desc    Add gallery images (admin)
// @route   POST /api/admin/gallery/images
// @access  Private (Admin)
export const addGalleryImages = async (req, res) => {
  try {
    const settings = await GallerySettings.getSettings();

    if (!req.files || !req.files.galleryImages || req.files.galleryImages.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No images provided',
      });
    }

    const uploadedImages = [];
    const files = req.files.galleryImages;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const url = await uploadBufferToCloudinary(file, 'Arboreal/gallery');
      
      // Extract alt text from filename (optional enhancement)
      const alt = file.originalname.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') || 'Gallery image';

      uploadedImages.push({
        url,
        alt,
      });
    }

    // Add new images to existing array
    settings.images = [...settings.images, ...uploadedImages];
    await settings.save();

    res.json({
      success: true,
      message: `${uploadedImages.length} image(s) added successfully`,
      settings,
    });
  } catch (error) {
    console.error('[ADD GALLERY IMAGES] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding gallery images',
      error: error.message,
    });
  }
};

// @desc    Remove selected gallery images (admin)
// @route   DELETE /api/admin/gallery/images
// @access  Private (Admin)
export const removeGalleryImages = async (req, res) => {
  try {
    const settings = await GallerySettings.getSettings();
    const { imageIds } = req.body; // Array of image IDs to remove

    if (!imageIds || !Array.isArray(imageIds) || imageIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No image IDs provided',
      });
    }

    // Find images to remove and delete from Cloudinary
    const imagesToRemove = settings.images.filter(img => 
      imageIds.includes(img._id.toString())
    );

    // Delete images from Cloudinary
    await Promise.all(
      imagesToRemove.map(async (img) => {
        try {
          await deleteByUrl(img.url);
        } catch (err) {
          console.error('[GALLERY DELETE] Failed to delete image from Cloudinary:', err.message);
        }
      })
    );

    // Remove images from array
    settings.images = settings.images.filter(
      img => !imageIds.includes(img._id.toString())
    );

    await settings.save();

    res.json({
      success: true,
      message: `${imagesToRemove.length} image(s) removed successfully`,
      settings,
    });
  } catch (error) {
    console.error('[REMOVE GALLERY IMAGES] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing gallery images',
      error: error.message,
    });
  }
};

// @desc    Update gallery image (alt text)
// @route   PUT /api/admin/gallery/images/:id
// @access  Private (Admin)
export const updateGalleryImage = async (req, res) => {
  try {
    const settings = await GallerySettings.getSettings();
    const { id } = req.params;
    const { alt } = req.body;

    const image = settings.images.id(id);
    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Image not found',
      });
    }

    if (alt !== undefined) image.alt = alt;

    await settings.save();

    res.json({
      success: true,
      message: 'Image updated successfully',
      settings,
    });
  } catch (error) {
    console.error('[UPDATE GALLERY IMAGE] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating gallery image',
      error: error.message,
    });
  }
};

// @desc    Get gallery settings (public for frontend)
// @route   GET /api/gallery
// @access  Public
export const getPublicGallerySettings = async (req, res) => {
  try {
    const settings = await GallerySettings.getSettings();
    res.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error('[GET PUBLIC GALLERY SETTINGS] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching gallery settings',
      error: error.message,
    });
  }
};

