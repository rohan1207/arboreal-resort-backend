import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subtitle: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    projectType: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: ['Architecture', 'Interior']
    },
    status: {
      type: String,
      trim: true,
    },
    year: {
      type: Number,
    },
    area: {
      value: { type: Number },
      unit: { type: String, default: 'sq.ft.' },
    },
    client: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    keyFeatures: {
      type: [String],
      default: [],
    },
    materialsUsed: {
      type: [String],
      default: [],
    },
    mainImage: {
      type: String,
      required: true,
    },
    galleryImages: {
      type: [String],
      default: [],
    },
    quote: {
      text: { type: String },
      author: { type: String },
    },
    seoTags: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

const Project = mongoose.model('Project', projectSchema);
export default Project;
