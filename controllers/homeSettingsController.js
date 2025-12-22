import HomeSettings from '../models/HomeSettings.js';
import { uploadBufferToCloudinary } from '../utils/cloudinaryUpload.js';
import { deleteByUrl } from '../utils/cloudinaryDelete.js';

// @desc    Get home settings (admin)
// @route   GET /api/admin/home
// @access  Private (Admin)
export const getHomeSettings = async (req, res) => {
  try {
    const settings = await HomeSettings.getSettings();
    res.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error('[GET HOME SETTINGS] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching home settings',
      error: error.message,
    });
  }
};

// @desc    Update home settings (admin)
// @route   PUT /api/admin/home
// @access  Private (Admin)
export const updateHomeSettings = async (req, res) => {
  try {
    const settings = await HomeSettings.getSettings();

    const {
      sliderHeading,
      sliderSubheading,
      sliderDescription,
      accommodation1Title,
      accommodation1Description,
      accommodation1Category,
      accommodation2Title,
      accommodation2Description,
      accommodation2Category,
    } = req.body;

    // Text fields
    if (sliderHeading !== undefined) settings.sliderHeading = sliderHeading;
    if (sliderSubheading !== undefined) settings.sliderSubheading = sliderSubheading;
    if (sliderDescription !== undefined) settings.sliderDescription = sliderDescription;

    // Hero video upload
    if (req.files && req.files.heroVideo && req.files.heroVideo[0]) {
      const file = req.files.heroVideo[0];
      if (settings.heroVideoUrl) {
        try {
          await deleteByUrl(settings.heroVideoUrl);
        } catch (err) {
          console.error('[HOME HERO VIDEO] Failed to delete old video:', err.message);
        }
      }
      const videoUrl = await uploadBufferToCloudinary(file, 'Arboreal/home/hero');
      settings.heroVideoUrl = videoUrl;
    }

    // Hero poster upload
    if (req.files && req.files.heroPoster && req.files.heroPoster[0]) {
      const file = req.files.heroPoster[0];
      if (settings.heroPosterUrl) {
        try {
          await deleteByUrl(settings.heroPosterUrl);
        } catch (err) {
          console.error('[HOME HERO POSTER] Failed to delete old poster:', err.message);
        }
      }
      const posterUrl = await uploadBufferToCloudinary(file, 'Arboreal/home/hero');
      settings.heroPosterUrl = posterUrl;
    }

    // Slider images upload (replace full set)
    if (req.files && req.files.sliderImages && req.files.sliderImages.length > 0) {
      // Delete old slider images
      if (settings.sliderImages && settings.sliderImages.length > 0) {
        await Promise.all(
          settings.sliderImages.map(async (url) => {
            try {
              await deleteByUrl(url);
            } catch (err) {
              console.error('[HOME SLIDER] Failed to delete old slider image:', err.message);
            }
          })
        );
      }

      const uploadedSliderUrls = [];
      for (const file of req.files.sliderImages) {
        const url = await uploadBufferToCloudinary(file, 'Arboreal/home/slider');
        uploadedSliderUrls.push(url);
      }
      settings.sliderImages = uploadedSliderUrls;
    }

    // Accommodation images (two cards)
    const accommodations = settings.accommodations || [];
    // Ensure exactly 2 slots
    while (accommodations.length < 2) {
      accommodations.push({
        title: '',
        description: '',
        category: 'ACCOMMODATION',
        imageUrl: '',
      });
    }

    // Card 1 text
    if (accommodation1Title !== undefined) accommodations[0].title = accommodation1Title;
    if (accommodation1Description !== undefined) accommodations[0].description = accommodation1Description;
    if (accommodation1Category !== undefined) accommodations[0].category = accommodation1Category;

    // Card 2 text
    if (accommodation2Title !== undefined) accommodations[1].title = accommodation2Title;
    if (accommodation2Description !== undefined) accommodations[1].description = accommodation2Description;
    if (accommodation2Category !== undefined) accommodations[1].category = accommodation2Category;

    // Card images
    if (req.files && req.files.accommodation1Image && req.files.accommodation1Image[0]) {
      const file = req.files.accommodation1Image[0];
      if (accommodations[0].imageUrl) {
        try {
          await deleteByUrl(accommodations[0].imageUrl);
        } catch (err) {
          console.error('[HOME ACCOMMODATION 1] Failed to delete old image:', err.message);
        }
      }
      const url = await uploadBufferToCloudinary(file, 'Arboreal/home/accommodation');
      accommodations[0].imageUrl = url;
    }

    if (req.files && req.files.accommodation2Image && req.files.accommodation2Image[0]) {
      const file = req.files.accommodation2Image[0];
      if (accommodations[1].imageUrl) {
        try {
          await deleteByUrl(accommodations[1].imageUrl);
        } catch (err) {
          console.error('[HOME ACCOMMODATION 2] Failed to delete old image:', err.message);
        }
      }
      const url = await uploadBufferToCloudinary(file, 'Arboreal/home/accommodation');
      accommodations[1].imageUrl = url;
    }

    settings.accommodations = accommodations;

    await settings.save();

    res.json({
      success: true,
      message: 'Home settings updated successfully',
      settings,
    });
  } catch (error) {
    console.error('[UPDATE HOME SETTINGS] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating home settings',
      error: error.message,
    });
  }
};

// @desc    Get home settings (public for frontend)
// @route   GET /api/home
// @access  Public
export const getPublicHomeSettings = async (req, res) => {
  try {
    const settings = await HomeSettings.getSettings();
    res.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error('[GET PUBLIC HOME SETTINGS] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching home settings',
      error: error.message,
    });
  }
};


