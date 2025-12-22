import Activity from '../models/Activity.js';
import { uploadBufferToCloudinary } from '../utils/cloudinaryUpload.js';

// @desc    Get all activities (admin)
// @route   GET /api/admin/activities
// @access  Private (Admin)
export const getActivities = async (req, res) => {
  try {
    const activities = await Activity.find().sort({ displayOrder: 1, createdAt: -1 });
    res.json({ success: true, activities });
  } catch (error) {
    console.error('[GET ACTIVITIES] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching activities',
      error: error.message,
    });
  }
};

// @desc    Get single activity (admin)
// @route   GET /api/admin/activities/:id
// @access  Private (Admin)
export const getActivity = async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found',
      });
    }
    res.json({ success: true, activity });
  } catch (error) {
    console.error('[GET ACTIVITY] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching activity',
      error: error.message,
    });
  }
};

// @desc    Create activity (admin)
// @route   POST /api/admin/activities
// @access  Private (Admin)
export const createActivity = async (req, res) => {
  try {
    const { name, description, price, isActive, displayOrder } = req.body;

    if (!name || !description || price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Name, description, and price are required',
      });
    }

    // Handle image uploads
    let images = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const url = await uploadBufferToCloudinary(file, 'Arboreal/activities');
          images.push(url);
        } catch (uploadError) {
          console.error('[CREATE ACTIVITY] Image upload error:', uploadError);
          return res.status(500).json({
            success: false,
            message: 'Failed to upload images',
            error: uploadError.message,
          });
        }
      }
    }

    if (images.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one image is required',
      });
    }

    const activity = await Activity.create({
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      images,
      isActive: isActive !== undefined ? (isActive === 'true' || isActive === true) : true,
      displayOrder: displayOrder !== undefined ? Number(displayOrder) : 0,
    });

    res.status(201).json({
      success: true,
      message: 'Activity created successfully',
      activity,
    });
  } catch (error) {
    console.error('[CREATE ACTIVITY] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating activity',
      error: error.message,
    });
  }
};

// @desc    Update activity (admin)
// @route   PUT /api/admin/activities/:id
// @access  Private (Admin)
export const updateActivity = async (req, res) => {
  try {
    const { name, description, price, isActive, displayOrder, existingImages } = req.body;

    const activity = await Activity.findById(req.params.id);
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found',
      });
    }

    if (name !== undefined) activity.name = name.trim();
    if (description !== undefined) activity.description = description.trim();
    if (price !== undefined) activity.price = Number(price);
    if (isActive !== undefined) activity.isActive = (isActive === 'true' || isActive === true);
    if (displayOrder !== undefined) activity.displayOrder = Number(displayOrder);

    // Handle image uploads - merge existing and new images
    let images = [];
    
    // Keep existing images if provided
    if (existingImages) {
      const existingArray = Array.isArray(existingImages) 
        ? existingImages 
        : typeof existingImages === 'string' 
        ? [existingImages] 
        : [];
      images = existingArray.filter(Boolean);
    } else {
      // If no existing images provided, keep current images
      images = activity.images || [];
    }

    // Add new uploaded images
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const url = await uploadBufferToCloudinary(file, 'Arboreal/activities');
          images.push(url);
        } catch (uploadError) {
          console.error('[UPDATE ACTIVITY] Image upload error:', uploadError);
          return res.status(500).json({
            success: false,
            message: 'Failed to upload images',
            error: uploadError.message,
          });
        }
      }
    }

    // Ensure at least one image exists
    if (images.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one image is required',
      });
    }

    activity.images = images;

    await activity.save();

    res.json({
      success: true,
      message: 'Activity updated successfully',
      activity,
    });
  } catch (error) {
    console.error('[UPDATE ACTIVITY] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating activity',
      error: error.message,
    });
  }
};

// @desc    Delete activity (admin)
// @route   DELETE /api/admin/activities/:id
// @access  Private (Admin)
export const deleteActivity = async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found',
      });
    }

    await Activity.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Activity deleted successfully',
    });
  } catch (error) {
    console.error('[DELETE ACTIVITY] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting activity',
      error: error.message,
    });
  }
};

// @desc    Get active activities (public)
// @route   GET /api/activities
// @access  Public
export const getPublicActivities = async (req, res) => {
  try {
    const activities = await Activity.find({ isActive: true })
      .sort({ displayOrder: 1, createdAt: -1 })
      .select('name description price images');
    res.json({ success: true, activities });
  } catch (error) {
    console.error('[GET PUBLIC ACTIVITIES] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching activities',
      error: error.message,
    });
  }
};

