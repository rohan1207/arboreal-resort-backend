import Video from '../models/Video.js';

// @desc    Get all videos
// @route   GET /api/videos
// @access  Public
export const getVideos = async (req, res) => {
  try {
    const videos = await Video.find({}).sort({ date: -1 });
    res.json(videos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a video
// @route   POST /api/videos
// @access  Private/Admin
export const createVideo = async (req, res) => {
  try {
    const { url, category, date } = req.body;

    if (!url || !category || !date) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const video = new Video({ url, category, date });
    const createdVideo = await video.save();
    res.status(201).json(createdVideo);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a video
// @route   DELETE /api/videos/:id
// @access  Private/Admin
export const deleteVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);

    if (video) {
      await video.deleteOne();
      res.json({ message: 'Video removed' });
    } else {
      res.status(404).json({ message: 'Video not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
