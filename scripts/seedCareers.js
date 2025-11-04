import mongoose from 'mongoose';
import dotenv from 'dotenv';
import CareerOpening from '../models/CareerOpening.js';
import connectDB from '../config/db.js';

dotenv.config();

const seedData = [
  {
    position: 'Junior Architect',
    shortDescription: 'Assist senior architects in design development and drafting.',
    location: 'Ahmedabad',
    salaryRange: '₹3–4.5 LPA',
    immediateJoiner: true,
    employmentType: 'Full Time',
  },
  {
    position: 'Interior Designer',
    shortDescription: 'Conceptualise interior layouts and material palettes for residential projects.',
    location: 'Remote',
    salaryRange: '₹25–35 k / month',
    immediateJoiner: false,
    employmentType: 'Full Time',
  },
  {
    position: 'Site Supervisor',
    shortDescription: 'Oversee on-site execution ensuring drawings are followed and quality maintained.',
    location: 'Vadodara',
    salaryRange: '₹20–30 k / month',
    immediateJoiner: true,
    employmentType: 'Full Time',
  },
  {
    position: 'Materials Manager',
    shortDescription: 'Manage procurement and inventory of construction & interior materials.',
    location: 'Ahmedabad',
    salaryRange: '₹4–6 LPA',
    immediateJoiner: false,
    employmentType: 'Full Time',
  },
  {
    position: 'Architecture Intern',
    shortDescription: '6-month internship focusing on 3D modelling and presentation drawings.',
    location: 'On-site',
    salaryRange: '₹10 k / month stipend',
    immediateJoiner: true,
    employmentType: 'Internship',
  },
];

(async () => {
  try {
    await connectDB();
    await CareerOpening.deleteMany(); // clear existing if needed
    const inserted = await CareerOpening.insertMany(seedData);
    console.log(`Inserted ${inserted.length} career openings.`);
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.connection.close();
  }
})();
