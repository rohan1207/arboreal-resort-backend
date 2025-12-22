import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from '../config/db.js';
import Admin from '../models/Admin.js';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the parent directory (project root)
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const seed = async () => {
  try {
    // Check if MONGODB_URI is set
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI is not defined in environment variables');
      console.error('💡 Please create a .env file in the project root with:');
      console.error('   MONGODB_URI=your_mongodb_connection_string');
      process.exit(1);
    }
    
    await connectDB();

    const username = 'arboreal@admin';
    const password = 'arboreal@2025';
    
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
