import ContactSettings from '../models/ContactSettings.js';
import { sendContactFormEmail } from '../utils/emailService.js';

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

// @desc    Submit contact form (sends email to reservations)
// @route   POST /api/contact/send
// @access  Public
export const submitContactForm = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, email, and message are required'
      });
    }

    try {
      await sendContactFormEmail({
        name: name.trim(),
        email: email.trim(),
        phone: (phone || '').trim(),
        subject: (subject || 'Contact form submission').trim(),
        message: message.trim()
      });
    } catch (emailError) {
      console.error('[CONTACT FORM] Failed to send email:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send your message. Please try again or contact us directly.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Your message has been sent successfully.'
    });
  } catch (error) {
    console.error('[CONTACT FORM] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again.'
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
        sendToWhatsApp: settings.sendToWhatsApp,
        formEnabled: settings.formEnabled,
        whatsappMessageTemplate: settings.whatsappMessageTemplate,
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

