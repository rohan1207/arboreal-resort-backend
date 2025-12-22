import mongoose from 'mongoose';

const aboutCardSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true },
    subtitle: { type: String, trim: true },
    description1: { type: String, trim: true },
    description2: { type: String, trim: true },
    imageUrl: { type: String, trim: true },
  },
  { _id: false }
);

const testimonialSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    text: { type: String, trim: true },
    rating: { type: Number, min: 1, max: 5, default: 5 },
    imageUrl: { type: String, trim: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { _id: false }
);

const aboutSettingsSchema = new mongoose.Schema(
  {
    cards: [aboutCardSchema],
    testimonials: [testimonialSchema],
  },
  {
    timestamps: true,
  }
);

aboutSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({
      cards: [],
      testimonials: [],
    });
  }
  return settings;
};

const AboutSettings = mongoose.model('AboutSettings', aboutSettingsSchema);

export default AboutSettings;


