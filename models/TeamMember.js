import mongoose from 'mongoose';

const teamMemberSchema = new mongoose.Schema(
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
    specialty: {
      type: String,
      trim: true,
    },
    bio: {
      type: String,
      trim: true,
    },
    image: {
      type: String, // Cloudinary URL
      required: true,
    },

  },
  { timestamps: true }
);

const TeamMember = mongoose.model('TeamMember', teamMemberSchema);

export default TeamMember;
