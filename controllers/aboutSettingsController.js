import AboutSettings from '../models/AboutSettings.js';
import { uploadBufferToCloudinary } from '../utils/cloudinaryUpload.js';
import { deleteByUrl } from '../utils/cloudinaryDelete.js';

// @desc    Get about settings (admin)
// @route   GET /api/admin/about
// @access  Private (Admin)
export const getAboutSettings = async (req, res) => {
  try {
    const settings = await AboutSettings.getSettings();
    res.json({ success: true, settings });
  } catch (error) {
    console.error('[GET ABOUT SETTINGS] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching about settings',
      error: error.message,
    });
  }
};

// @desc    Update about settings (admin)
// @route   PUT /api/admin/about
// @access  Private (Admin)
export const updateAboutSettings = async (req, res) => {
  try {
    const settings = await AboutSettings.getSettings();

    const { cards, testimonials } = req.body;

    // Update cards text content
    if (cards) {
      try {
        const parsedCards = JSON.parse(cards);
        if (Array.isArray(parsedCards)) {
          // Preserve existing imageUrl unless changed via upload
          settings.cards = parsedCards.map((card, index) => ({
            title: card.title || '',
            subtitle: card.subtitle || '',
            description1: card.description1 || '',
            description2: card.description2 || '',
            imageUrl: settings.cards?.[index]?.imageUrl || card.imageUrl || '',
          }));
        }
      } catch (err) {
        console.error('[ABOUT SETTINGS] Failed to parse cards JSON:', err.message);
      }
    }

    // Update testimonials text content
    if (testimonials) {
      try {
        const parsedTestimonials = JSON.parse(testimonials);
        if (Array.isArray(parsedTestimonials)) {
          settings.testimonials = parsedTestimonials.map((t, index) => ({
            name: t.name || '',
            text: t.text || '',
            rating:
              typeof t.rating === 'number' && t.rating >= 1 && t.rating <= 5
                ? t.rating
                : 5,
            imageUrl: settings.testimonials?.[index]?.imageUrl || t.imageUrl || '',
            order: typeof t.order === 'number' ? t.order : index,
            isActive: t.isActive !== undefined ? !!t.isActive : true,
          }));
        }
      } catch (err) {
        console.error('[ABOUT SETTINGS] Failed to parse testimonials JSON:', err.message);
      }
    }

    // Handle card images upload (card1Image, card2Image)
    if (req.files) {
      const ensureCards = () => {
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
      };

      if (req.files.card1Image && req.files.card1Image[0]) {
        ensureCards();
        const file = req.files.card1Image[0];
        if (settings.cards[0].imageUrl) {
          try {
            await deleteByUrl(settings.cards[0].imageUrl);
          } catch (err) {
            console.error('[ABOUT CARD 1] Failed to delete old image:', err.message);
          }
        }
        const url = await uploadBufferToCloudinary(file, 'Arboreal/about/cards');
        settings.cards[0].imageUrl = url;
      }

      if (req.files.card2Image && req.files.card2Image[0]) {
        ensureCards();
        const file = req.files.card2Image[0];
        if (settings.cards[1].imageUrl) {
          try {
            await deleteByUrl(settings.cards[1].imageUrl);
          } catch (err) {
            console.error('[ABOUT CARD 2] Failed to delete old image:', err.message);
          }
        }
        const url = await uploadBufferToCloudinary(file, 'Arboreal/about/cards');
        settings.cards[1].imageUrl = url;
      }

      // Testimonial avatar images: testimonialImage_0, testimonialImage_1, etc.
      if (req.files && Object.keys(req.files).length > 0) {
        for (const fieldName of Object.keys(req.files)) {
          if (fieldName.startsWith('testimonialImage_')) {
            const indexStr = fieldName.split('_')[1];
            const idx = parseInt(indexStr, 10);
            if (!Number.isNaN(idx)) {
              if (!settings.testimonials || settings.testimonials.length <= idx) {
                // Ensure array length
                while (settings.testimonials.length <= idx) {
                  settings.testimonials.push({
                    name: '',
                    text: '',
                    rating: 5,
                    imageUrl: '',
                    order: settings.testimonials.length,
                    isActive: true,
                  });
                }
              }
              const file = req.files[fieldName][0];
              if (settings.testimonials[idx].imageUrl) {
                try {
                  await deleteByUrl(settings.testimonials[idx].imageUrl);
                } catch (err) {
                  console.error(
                    `[ABOUT TESTIMONIAL ${idx}] Failed to delete old image:`,
                    err.message
                  );
                }
              }
              const url = await uploadBufferToCloudinary(
                file,
                'Arboreal/about/testimonials'
              );
              settings.testimonials[idx].imageUrl = url;
            }
          }
        }
      }
    }

    await settings.save();

    res.json({
      success: true,
      message: 'About settings updated successfully',
      settings,
    });
  } catch (error) {
    console.error('[UPDATE ABOUT SETTINGS] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating about settings',
      error: error.message,
    });
  }
};

// @desc    Get about settings (public)
// @route   GET /api/about
// @access  Public
export const getPublicAboutSettings = async (req, res) => {
  try {
    const settings = await AboutSettings.getSettings();
    const activeTestimonials = (settings.testimonials || [])
      .filter((t) => t.isActive)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    res.json({
      success: true,
      settings: {
        cards: settings.cards || [],
        testimonials: activeTestimonials,
      },
    });
  } catch (error) {
    console.error('[GET PUBLIC ABOUT SETTINGS] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching about settings',
      error: error.message,
    });
  }
};


