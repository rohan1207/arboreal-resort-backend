import HeroImage from '../models/HeroImage.js';
import { uploadBufferToCloudinary } from '../utils/cloudinaryUpload.js';
import { deleteByUrl } from '../utils/cloudinaryDelete.js';

// Get the current hero image
export const getHeroImage = async (req, res) => {
  try {
    const heroImage = await HeroImage.findOne();
    if (!heroImage) {
      return res.status(404).json({ message: 'Hero image not found.' });
    }
    res.json(heroImage);
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching hero image.', error: error.message });
  }
};

// Update the hero image
export const updateHeroImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Image file is required.' });
    }

    const existingImage = await HeroImage.findOne();

    // If an image already exists, delete it from Cloudinary
    if (existingImage && existingImage.imageUrl) {
      await deleteByUrl(existingImage.imageUrl);
    }

    // Upload the new image to Cloudinary
    const newImageUrl = await uploadBufferToCloudinary(req.file, 'Aagaur/hero');
    const publicId = newImageUrl.split('/').pop().split('.')[0];

    let updatedImage;
    if (existingImage) {
      // If a document exists, update it
      existingImage.imageUrl = newImageUrl;
      existingImage.public_id = publicId;
      updatedImage = await existingImage.save();
    } else {
      // Otherwise, create a new document
      updatedImage = await HeroImage.create({
        imageUrl: newImageUrl,
        public_id: publicId,
      });
    }

    res.status(200).json(updatedImage);
  } catch (error) {
    console.error('--- ERROR UPDATING HERO IMAGE ---', error);
    res.status(500).json({ 
      message: 'Server error while updating hero image.', 
      error: error.message 
    });
  }
};
