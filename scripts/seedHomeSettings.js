import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import HomeSettings from '../models/HomeSettings.js';

dotenv.config();

const run = async () => {
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB');

    const settings = await HomeSettings.getSettings();

    // Seed hero video & poster from current frontend fallbacks
    settings.heroVideoUrl =
      settings.heroVideoUrl ||
      'https://res.cloudinary.com/dxevy8mea/video/upload/Arboreal/hero/YOUTUBE.mp4';

    settings.heroPosterUrl =
      settings.heroPosterUrl ||
      'https://res.cloudinary.com/dxevy8mea/image/upload/Arboreal/hero/YOUTUBE.jpg';

    // Seed slider heading/content
    settings.sliderHeading = settings.sliderHeading || 'LONAVALA';
    settings.sliderSubheading = settings.sliderSubheading || 'The Arboreal Resort';
    settings.sliderDescription =
      settings.sliderDescription ||
      'Tucked away in the untouched forests of the Western Ghats, The Arboreal Resort is an eco-luxury retreat overlooking the serene Pawna Lake.';

    // Seed slider images from current frontend defaults if empty
    if (!settings.sliderImages || settings.sliderImages.length === 0) {
      settings.sliderImages = [
        'https://res.cloudinary.com/dxevy8mea/image/upload/Arboreal/slider/slider5',
        'https://res.cloudinary.com/dxevy8mea/image/upload/Arboreal/slider/slider6',
        'https://res.cloudinary.com/dxevy8mea/image/upload/Arboreal/slider/slider7',
        'https://res.cloudinary.com/dxevy8mea/image/upload/Arboreal/slider/slider8',
        'https://res.cloudinary.com/dxevy8mea/image/upload/Arboreal/slider/slider9',
      ];
    }

    // Seed accommodations from current frontend defaults if empty
    if (!settings.accommodations || settings.accommodations.length === 0) {
      settings.accommodations = [
        {
          title: 'The Tree-House Resort',
          category: 'ACCOMMODATION',
          description:
            'Our elevated structures bring you to the treetops of the valley, offering an unparalleled experience akin to the best tree house in Lonavala. With the lush green rainforest as your backdrop, the view is truly mesmerizing and calming.',
          imageUrl:
            'https://res.cloudinary.com/dxevy8mea/image/upload/Arboreal/accommodation/ac2',
        },
        {
          title: 'The Amazing Nature',
          category: 'ACCOMMODATION',
          description:
            'Our elevated structures bring you to the treetops of the valley, offering an unparalleled experience akin to the best tree house in Lonavala. With the lush green rainforest as your backdrop, the view is truly mesmerizing and calming.',
          imageUrl:
            'https://res.cloudinary.com/dxevy8mea/image/upload/Arboreal/accommodation/ac',
        },
      ];
    }

    await settings.save();

    console.log('✅ HomeSettings seeded/updated successfully');
    console.log('Hero video URL:', settings.heroVideoUrl);
    console.log('Hero poster URL:', settings.heroPosterUrl);
    console.log('Slider images:', settings.sliderImages.length);
    console.log('Accommodations:', settings.accommodations.length);
  } catch (err) {
    console.error('❌ Error seeding HomeSettings:', err);
  } finally {
    process.exit(0);
  }
};

run();


