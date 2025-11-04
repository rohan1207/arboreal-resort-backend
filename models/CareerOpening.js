import mongoose from 'mongoose';

const careerOpeningSchema = new mongoose.Schema(
  {
    position: {
      type: String,
      required: true,
      trim: true,
    },
    shortDescription: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    salaryRange: {
      type: String, // e.g. "₹4-6 LPA" or "$50-70k"
      trim: true,
    },
    immediateJoiner: {
      type: Boolean,
      default: false,
    },
    employmentType: {
      type: String,
      enum: ['Full Time', 'Internship'],
      default: 'Full Time',
    },
    isOpen: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const CareerOpening = mongoose.model('CareerOpening', careerOpeningSchema);
export default CareerOpening;
