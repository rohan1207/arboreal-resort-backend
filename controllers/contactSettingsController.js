import ContactSettings from '../models/ContactSettings.js';

// @desc    Get contact settings
// @route   GET /api/admin/contact
// @access  Private (Admin)
export const getContactSettings = async (req, res) => {
  try {
    const settings = await ContactSettings.getSettings();
    res.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error('[GET CONTACT SETTINGS] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching contact settings',
      error: error.message,
    });
  }
};

// @desc    Update contact settings
// @route   PUT /api/admin/contact
// @access  Private (Admin)
export const updateContactSettings = async (req, res) => {
  try {
    const settings = await ContactSettings.getSettings();

    const {
      address,
      addressLink,
      phone,
      phoneDisplay,
      email,
      workingHours,
      whatsappNumber,
      whatsappMessageTemplate,
      formEnabled,
      sendToWhatsApp,
      sendToEmail,
      emailRecipient,
    } = req.body;

    if (address !== undefined) settings.address = address;
    if (addressLink !== undefined) settings.addressLink = addressLink;
    if (phone !== undefined) settings.phone = phone;
    if (phoneDisplay !== undefined) settings.phoneDisplay = phoneDisplay;
    if (email !== undefined) settings.email = email;
    if (workingHours !== undefined) settings.workingHours = workingHours;
    if (whatsappNumber !== undefined) {
      // Clean WhatsApp number (remove +, spaces, dashes)
      settings.whatsappNumber = whatsappNumber.replace(/[\s\+\-\(\)]/g, '');
    }
    if (whatsappMessageTemplate !== undefined) settings.whatsappMessageTemplate = whatsappMessageTemplate;
    if (formEnabled !== undefined) settings.formEnabled = formEnabled === 'true' || formEnabled === true;
    if (sendToWhatsApp !== undefined) settings.sendToWhatsApp = sendToWhatsApp === 'true' || sendToWhatsApp === true;
    if (sendToEmail !== undefined) settings.sendToEmail = sendToEmail === 'true' || sendToEmail === true;
    if (emailRecipient !== undefined) settings.emailRecipient = emailRecipient;

    await settings.save();

    res.json({
      success: true,
      message: 'Contact settings updated successfully',
      settings,
    });
  } catch (error) {
    console.error('[UPDATE CONTACT SETTINGS] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating contact settings',
      error: error.message,
    });
  }
};

// @desc    Get contact settings (public)
// @route   GET /api/contact
// @access  Public
export const getPublicContactSettings = async (req, res) => {
  try {
    const settings = await ContactSettings.getSettings();
    res.json({
      success: true,
      settings: {
        address: settings.address,
        addressLink: settings.addressLink,
        phone: settings.phone,
        phoneDisplay: settings.phoneDisplay,
        email: settings.email,
        workingHours: settings.workingHours,
        whatsappNumber: settings.whatsappNumber,
        formEnabled: settings.formEnabled,
      },
    });
  } catch (error) {
    console.error('[GET PUBLIC CONTACT SETTINGS] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching contact settings',
      error: error.message,
    });
  }
};

