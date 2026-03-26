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

    try {
      const filesArray = Array.isArray(req.files) ? req.files : [];
      console.log('[ABOUT SETTINGS][ADMIN] updateAboutSettings called', {
        bodyKeys: Object.keys(req.body || {}),
        hasCardsField: !!cards,
        hasTestimonialsField: !!testimonials,
        filesCount: filesArray.length,
        fileFieldnames: filesArray.map((f) => f.fieldname),
        fileSummaries: filesArray.map((f) => ({
          fieldname: f.fieldname,
          originalname: f.originalname,
          mimetype: f.mimetype,
          size: f.size,
        })),
      });
    } catch (logErr) {
      console.error('[ABOUT SETTINGS][ADMIN] Failed to log initial debug info:', logErr.message);
    }

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
    // Note: multer.any() returns files as an array, not an object
    if (req.files && Array.isArray(req.files)) {
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

      // Find card1Image file by fieldname
      const card1File = req.files.find(f => f.fieldname === 'card1Image');
      if (card1File) {
        console.log('[ABOUT CARD 1][ADMIN] File received', {
          originalname: card1File.originalname,
          mimetype: card1File.mimetype,
          size: card1File.size,
        });
        ensureCards();
        if (settings.cards[0].imageUrl) {
          try {
            await deleteByUrl(settings.cards[0].imageUrl);
          } catch (err) {
            console.error('[ABOUT CARD 1] Failed to delete old image:', err.message);
          }
        }
        const url = await uploadBufferToCloudinary(card1File, 'Arboreal/about/cards');
        console.log('[ABOUT CARD 1][ADMIN] Uploaded new image to Cloudinary', { url });
        settings.cards[0].imageUrl = url;
      } else {
        console.log('[ABOUT CARD 1][ADMIN] No card1Image file found in req.files');
      }

      // Find card2Image file by fieldname
      const card2File = req.files.find(f => f.fieldname === 'card2Image');
      if (card2File) {
        console.log('[ABOUT CARD 2][ADMIN] File received', {
          originalname: card2File.originalname,
          mimetype: card2File.mimetype,
          size: card2File.size,
        });
        ensureCards();
        if (settings.cards[1].imageUrl) {
          try {
            await deleteByUrl(settings.cards[1].imageUrl);
          } catch (err) {
            console.error('[ABOUT CARD 2] Failed to delete old image:', err.message);
          }
        }
        const url = await uploadBufferToCloudinary(card2File, 'Arboreal/about/cards');
        console.log('[ABOUT CARD 2][ADMIN] Uploaded new image to Cloudinary', { url });
        settings.cards[1].imageUrl = url;
      } else {
        console.log('[ABOUT CARD 2][ADMIN] No card2Image file found in req.files');
      }

      // Testimonial avatar images: testimonialImage_0, testimonialImage_1, etc.
      for (const file of req.files) {
        if (file.fieldname && file.fieldname.startsWith('testimonialImage_')) {
          const indexStr = file.fieldname.split('_')[1];
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
            console.log(`[ABOUT TESTIMONIAL][ADMIN] Uploaded avatar for index ${idx}`, {
              url,
              originalname: file.originalname,
              mimetype: file.mimetype,
              size: file.size,
            });
            settings.testimonials[idx].imageUrl = url;
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


