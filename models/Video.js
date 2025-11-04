import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['Architecture', 'Event', 'Interior', 'All'],
    },
    date: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

const Video = mongoose.model('Video', videoSchema);

export default Video;
