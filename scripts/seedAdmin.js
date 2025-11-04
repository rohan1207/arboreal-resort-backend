import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import Admin from '../models/Admin.js';

dotenv.config();

const seed = async () => {
  try {
    await connectDB();

    const username = 'Admin@123';
    const password = 'Admin@123';
    
    let admin = await Admin.findOne({ username });
    if (admin) {
      console.log('Admin already exists');
    } else {
      admin = await Admin.create({ username, password, name: 'Super Admin' });
      console.log('Admin created');
    }
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.connection.close();
  }
};

seed();
