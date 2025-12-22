import mongoose from 'mongoose';

const contactSettingsSchema = new mongoose.Schema(
  {
    // Contact Information Cards
    address: {
      type: String,
      trim: true,
      default: 'The Arboreal, Pvt. Road, Gevhande Apati, Lonavala, Maharashtra 412108',
    },
    addressLink: {
      type: String,
      trim: true,
      default: 'https://maps.app.goo.gl/2EL8NXUZgh4An2NL8',
    },
    phone: {
      type: String,
      trim: true,
      default: '+91 8065423948',
    },
    phoneDisplay: {
      type: String,
      trim: true,
      default: '+91 8065423948  *(+91 is essential)',
    },
    email: {
      type: String,
      trim: true,
      default: 'reservations@thearborealresort.com',
    },
    workingHours: {
      type: String,
      trim: true,
      default: '24/7 Reception, Always Available',
    },
    
    // WhatsApp Configuration
    whatsappNumber: {
      type: String,
      trim: true,
      required: [true, 'WhatsApp number is required'],
      default: '918065423948', // Format: country code + number without + or spaces
    },
    whatsappMessageTemplate: {
      type: String,
      trim: true,
      default: '*New Contact Form Submission*\n\n*Name:* {name}\n*Email:* {email}\n*Phone:* {phone}\n*Subject:* {subject}\n\n*Message:*\n{message}',
    },
    
    // Form Settings
    formEnabled: {
      type: Boolean,
      default: true,
    },
    sendToWhatsApp: {
      type: Boolean,
      default: true,
    },
    sendToEmail: {
      type: Boolean,
      default: false,
    },
    emailRecipient: {
      type: String,
      trim: true,
      default: 'reservations@thearborealresort.com',
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only one document exists
contactSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

const ContactSettings = mongoose.model('ContactSettings', contactSettingsSchema);

export default ContactSettings;

