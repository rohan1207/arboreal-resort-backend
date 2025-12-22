import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import AboutSettings from '../models/AboutSettings.js';

dotenv.config();

const run = async () => {
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB');

    const settings = await AboutSettings.getSettings();

    // Seed About cards from current About.jsx content if empty
    if (!settings.cards || settings.cards.length === 0) {
      settings.cards = [
        {
          title: 'History of The Arboreal Resort',
          subtitle: '',
          description1:
            'Welcome to The Arboreal Resort in Gevhande, Apti, Lonavala — a serene escape tucked at the foothills of the Western Ghats. Designed as a luxurious yet eco-friendly retreat, our resort is surrounded by lush greenery, tranquil hills, and an abundance of flora and fauna.',
          description2:
            "Here, you'll find more than just a stay. With an outdoor pool, a multi-cuisine restaurant, and curated activities, we bring you closer to nature while ensuring modern comforts. Whether it's trekking, bird watching, or a rejuvenating yoga session, every moment is crafted to help you reconnect with yourself and the world around you.",
          imageUrl: '/hero.webp',
        },
        {
          title: 'Why Choose Us?',
          subtitle: '',
          description1:
            'At The Arboreal Resort, every detail is built to give you the perfect getaway. Our spacious, modern rooms come with private balconies offering panoramic views of the misty hills. Imagine mornings where you wake up to the melody of chirping birds, rustling trees, and cool breezes drifting through your window.',
          description2:
            "Whether you're here for adventure or relaxation, we've got something for everyone. From nature walks and meditation to poolside leisure and fine dining, we ensure your experience is both indulgent and unforgettable. For those seeking the best rainforest resort in Lonavala, Arboreal is where nature and luxury meet in harmony.",
          imageUrl: '/slider13.webp',
        },
      ];
    }

    // Seed testimonials from current Testimonials.jsx content if empty
    if (!settings.testimonials || settings.testimonials.length === 0) {
      settings.testimonials = [
        {
          name: 'Priya Sharma',
          text: 'This resort offers an escape into pure bliss! Everything. The rooms were so spacious, and it was really better our stunning stay! The amenities were top-notch from start to finish! The service was impeccable, the food at the resort was great! I felt at home. I\'d happily be returning vacation, I didn\'t really want the last place to be. The adventure now was really great.',
          rating: 5,
          imageUrl: '/slider5.webp',
          order: 0,
          isActive: true,
        },
        {
          name: 'Rajesh Kumar',
          text: 'An absolutely breathtaking experience! The forest views from our room were stunning, and the staff went above and beyond to make our stay special. The private bathtub experience was unforgettable. Every detail was carefully thought out, from the welcome drinks to the personalized service. We celebrated our anniversary here and couldn\'t have chosen a better place.',
          rating: 5,
          imageUrl: '/slider7.webp',
          order: 1,
          isActive: true,
        },
        {
          name: 'Anjali Patel',
          text: 'A hidden gem in the heart of nature! The luxury sunroom exceeded all our expectations. Waking up to birds chirping and sunlight streaming through panoramic windows was magical. The spa treatments were divine, and the restaurant served the most delicious local cuisine. Perfect for couples seeking romance and relaxation.',
          rating: 5,
          imageUrl: '/slider6.webp',
          order: 2,
          isActive: true,
        },
        {
          name: 'Vikram Reddy',
          text: 'Outstanding hospitality and pristine facilities! Our family had an amazing time at this resort. The kids loved the pool, and we enjoyed the peaceful forest walks. The rooms were spotlessly clean and beautifully decorated. The staff remembered our names and preferences throughout our stay. Highly recommend for family vacations!',
          rating: 5,
          imageUrl: '/slider8.webp',
          order: 3,
          isActive: true,
        },
        {
          name: 'Neha Kapoor',
          text: 'Pure luxury meets natural beauty! This was our dream honeymoon destination. The private pool room was spectacular, offering complete privacy and romance. The sunset views from our deck were breathtaking. Every meal was a culinary masterpiece. The resort perfectly balances modern amenities with rustic charm. We\'re already planning our next visit!',
          rating: 5,
          imageUrl: '/slider9.webp',
          order: 4,
          isActive: true,
        },
      ];
    }

    await settings.save();

    console.log('✅ AboutSettings seeded/updated successfully');
    console.log('Cards:', settings.cards.length);
    console.log('Testimonials:', settings.testimonials.length);
  } catch (err) {
    console.error('❌ Error seeding AboutSettings:', err);
  } finally {
    process.exit(0);
  }
};

run();


