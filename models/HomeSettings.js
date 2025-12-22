import mongoose from 'mongoose';

const accommodationSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true },
    description: { type: String, trim: true },
    category: { type: String, trim: true },
    imageUrl: { type: String, trim: true },
  },
  { _id: false }
);

const homeSettingsSchema = new mongoose.Schema(
  {
    // Hero section
    heroVideoUrl: { type: String, trim: true },
    heroPosterUrl: { type: String, trim: true },

    // Slider section
    sliderHeading: { type: String, trim: true },
    sliderSubheading: { type: String, trim: true },
    sliderDescription: { type: String, trim: true },
    sliderImages: [{ type: String, trim: true }],

    // Accommodation section (2 cards on homepage)
    accommodations: [accommodationSchema],
  },
  {
    timestamps: true,
  }
);

// Ensure only one document exists
homeSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({
      sliderHeading: 'LONAVALA',
      sliderSubheading: 'The Arboreal Resort',
      sliderDescription:
        'Tucked away in the untouched forests of the Western Ghats, The Arboreal Resort is an eco-luxury retreat overlooking the serene Pawna Lake.',
      accommodations: [
        {
          title: 'The Tree-House Resort',
          category: 'ACCOMMODATION',
          description:
            'Our elevated structures bring you to the treetops of the valley, offering an unparalleled experience akin to the best tree house in Lonavala.',
          imageUrl: '',
        },
        {
          title: 'The Amazing Nature',
          category: 'ACCOMMODATION',
          description:
            'With the lush green rainforest as your backdrop, the view is truly mesmerizing and calming.',
          imageUrl: '',
        },
      ],
    });
  }
  return settings;
};

const HomeSettings = mongoose.model('HomeSettings', homeSettingsSchema);

export default HomeSettings;


