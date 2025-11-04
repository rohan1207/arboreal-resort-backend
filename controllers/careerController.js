import CareerOpening from '../models/CareerOpening.js';

// Public: list open positions only
export const getOpenPositions = async (req, res) => {
  try {
    const openings = await CareerOpening.find({ isOpen: true }).sort({ createdAt: -1 });
    res.json(openings);
  } catch (err) {
    console.error('Error fetching open positions', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: list all positions (open & closed)
export const getAllPositions = async (req, res) => {
  try {
    const openings = await CareerOpening.find().sort({ createdAt: -1 });
    res.json(openings);
  } catch (err) {
    console.error('Error fetching all positions', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create new opening
export const createPosition = async (req, res) => {
  try {
    const newOpening = await CareerOpening.create(req.body);
    res.status(201).json(newOpening);
  } catch (err) {
    console.error('Error creating position', err);
    res.status(400).json({ message: 'Invalid data' });
  }
};

// Update opening
export const updatePosition = async (req, res) => {
  try {
    const updated = await CareerOpening.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json(updated);
  } catch (err) {
    console.error('Error updating position', err);
    res.status(400).json({ message: 'Invalid data' });
  }
};

// Toggle isOpen flag
export const togglePosition = async (req, res) => {
  try {
    const opening = await CareerOpening.findById(req.params.id);
    if (!opening) return res.status(404).json({ message: 'Not found' });
    opening.isOpen = !opening.isOpen;
    await opening.save();
    res.json(opening);
  } catch (err) {
    console.error('Error toggling position', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete opening (optional)
export const deletePosition = async (req, res) => {
  try {
    const del = await CareerOpening.findByIdAndDelete(req.params.id);
    if (!del) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('Error deleting position', err);
    res.status(500).json({ message: 'Server error' });
  }
};
