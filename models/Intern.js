import mongoose from 'mongoose';

const internSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      required: true,
      trim: true,
    },
    bio: {
      type: String,
      trim: true,
    },
    image: {
      type: String, // Cloudinary URL
      required: true,
    }
  },
  { timestamps: true }
);

const Intern = mongoose.model('Intern', internSchema);

export default Intern;
