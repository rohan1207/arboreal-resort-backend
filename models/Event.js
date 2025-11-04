import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  tagline: {
    type: String,
    required: true,
    trim: true,
  },
  mainImage: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  categories: [{
    type: String,
    required: true,
    enum: ['Sustainable Architecture', 'Workshop', 'Construction', 'Earth Building','events'],
  }],
  galleryImages: [{
    type: String,
  }],
}, { timestamps: true });

const Event = mongoose.model('Event', eventSchema);

export default Event;
