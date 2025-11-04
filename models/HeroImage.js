import mongoose from 'mongoose';

const heroImageSchema = new mongoose.Schema({
  imageUrl: {
    type: String,
    required: true,
  },
  public_id: {
    type: String,
    required: true,
  },
});

const HeroImage = mongoose.model('HeroImage', heroImageSchema);
export default HeroImage;
