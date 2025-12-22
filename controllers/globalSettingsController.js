import GlobalSettings from '../models/GlobalSettings.js';

// @desc    Get global settings (admin)
// @route   GET /api/admin/settings
// @access  Private (Admin)
export const getGlobalSettings = async (req, res) => {
  try {
    const settings = await GlobalSettings.getSettings();
    res.json({ success: true, settings });
  } catch (error) {
    console.error('[GET GLOBAL SETTINGS] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching global settings',
      error: error.message,
    });
  }
};

// @desc    Update global settings (admin)
// @route   PUT /api/admin/settings
// @access  Private (Admin)
export const updateGlobalSettings = async (req, res) => {
  try {
    const settings = await GlobalSettings.getSettings();
    const { discountAmount, discountType, discountValue, bookingPolicy, activitiesEnabled } = req.body;

    // Handle discount type
    if (discountType !== undefined) {
      if (!['amount', 'percentage'].includes(discountType)) {
        return res.status(400).json({
          success: false,
          message: 'Discount type must be either "amount" or "percentage"',
        });
      }
      settings.discountType = discountType;
    }

    // Handle discount value
    if (discountValue !== undefined) {
      const parsed = Number(discountValue);
      if (Number.isNaN(parsed) || parsed < 0) {
        return res.status(400).json({
          success: false,
          message: 'Discount value must be a non-negative number',
        });
      }
      // Validate percentage doesn't exceed 100%
      const currentType = discountType !== undefined ? discountType : settings.discountType || 'amount';
      if (currentType === 'percentage' && parsed > 100) {
        return res.status(400).json({
          success: false,
          message: 'Percentage discount cannot exceed 100%',
        });
      }
      settings.discountValue = parsed;
    }

    // Backward compatibility: if discountAmount is provided (old format), treat as amount type
    if (discountAmount !== undefined && discountType === undefined && discountValue === undefined) {
      const parsed = Number(discountAmount);
      if (Number.isNaN(parsed) || parsed < 0) {
        return res.status(400).json({
          success: false,
          message: 'Discount amount must be a non-negative number',
        });
      }
      settings.discountType = 'amount';
      settings.discountValue = parsed;
      settings.discountAmount = parsed; // Keep for backward compatibility
    }

    if (bookingPolicy !== undefined) {
      if (Array.isArray(bookingPolicy)) {
        // Validate and set the policies array
        const validatedPolicies = bookingPolicy
          .filter(policy => policy && policy.title && policy.content)
          .map((policy, index) => ({
            title: String(policy.title).trim(),
            content: String(policy.content).trim(),
            displayOrder: typeof policy.displayOrder === 'number' ? policy.displayOrder : index,
          }));
        settings.bookingPolicy = validatedPolicies;
      }
    }

    if (activitiesEnabled !== undefined) {
      settings.activitiesEnabled = Boolean(activitiesEnabled);
    }

    await settings.save();

    res.json({
      success: true,
      message: 'Global settings updated successfully',
      settings,
    });
  } catch (error) {
    console.error('[UPDATE GLOBAL SETTINGS] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating global settings',
      error: error.message,
    });
  }
};

// @desc    Get global settings (public)
// @route   GET /api/settings
// @access  Public
export const getPublicGlobalSettings = async (req, res) => {
  try {
    const settings = await GlobalSettings.getSettings();
    
    // Migrate old bookingPolicy format (object) to new format (array) if needed
    let bookingPolicy = settings.bookingPolicy;
    if (bookingPolicy && typeof bookingPolicy === 'object' && !Array.isArray(bookingPolicy)) {
      // Convert old format to new format
      const policies = [];
      if (bookingPolicy.cancellation) {
        policies.push({ title: 'Cancellation policy', content: bookingPolicy.cancellation, displayOrder: 0 });
      }
      if (bookingPolicy.extraOccupancy) {
        policies.push({ title: 'Extra occupancy policy', content: bookingPolicy.extraOccupancy, displayOrder: 1 });
      }
      if (bookingPolicy.guarantee) {
        policies.push({ title: 'Guarantee policy', content: bookingPolicy.guarantee, displayOrder: 2 });
      }
      if (bookingPolicy.children) {
        policies.push({ title: 'Children policy', content: bookingPolicy.children, displayOrder: 3 });
      }
      if (bookingPolicy.checkIn) {
        policies.push({ title: 'Check in policy', content: bookingPolicy.checkIn, displayOrder: 4 });
      }
      if (bookingPolicy.pet) {
        policies.push({ title: 'Pet policy', content: bookingPolicy.pet, displayOrder: 5 });
      }
      
      // Save migrated format
      if (policies.length > 0) {
        settings.bookingPolicy = policies;
        await settings.save();
        bookingPolicy = policies;
      }
    }
    
    // Ensure bookingPolicy is an array (use defaults if empty)
    if (!bookingPolicy || (Array.isArray(bookingPolicy) && bookingPolicy.length === 0)) {
      bookingPolicy = settings.schema.path('bookingPolicy').defaultValue || [];
    }
    
    // Handle discount settings - backward compatibility
    let discountType = settings.discountType || 'amount';
    let discountValue = settings.discountValue;
    
    // If discountType/discountValue not set but discountAmount exists, migrate
    if (!discountValue && settings.discountAmount) {
      discountType = 'amount';
      discountValue = settings.discountAmount;
      // Auto-migrate in background (don't await to avoid blocking)
      settings.discountType = 'amount';
      settings.discountValue = settings.discountAmount;
      settings.save().catch(err => console.error('[MIGRATION] Failed to migrate discount:', err));
    } else if (!discountValue) {
      discountValue = 1500; // Default
    }
    
    res.json({
      success: true,
      settings: {
        discountAmount: discountType === 'amount' ? discountValue : null, // For backward compatibility
        discountType: discountType,
        discountValue: discountValue,
        bookingPolicy: bookingPolicy,
        activitiesEnabled: settings.activitiesEnabled,
      },
    });
  } catch (error) {
    console.error('[GET PUBLIC GLOBAL SETTINGS] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching global settings',
      error: error.message,
    });
  }
};


