import mongoose from 'mongoose';

const galleryImageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, trim: true },
    alt: { type: String, trim: true, default: '' },
  },
  { _id: true }
);

const gallerySettingsSchema = new mongoose.Schema(
  {
    images: [galleryImageSchema],
  },
  {
    timestamps: true,
  }
);

// Ensure only one document exists
gallerySettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({
      images: [],
    });
  }
  return settings;
};

const GallerySettings = mongoose.model('GallerySettings', gallerySettingsSchema);

export default GallerySettings;

