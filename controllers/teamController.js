import TeamMember from '../models/TeamMember.js';
import Intern from '../models/Intern.js';
import { uploadBufferToCloudinary } from '../utils/cloudinaryUpload.js';

// --- Team Member Controllers ---

export const createTeamMember = async (req, res) => {
  try {
    const { name, role, specialty, bio } = req.body;
    if (!req.file) {
      return res.status(400).json({ message: 'Image is required.' });
    }

    const imageUrl = await uploadBufferToCloudinary(req.file, 'Aagaur/team');

    const newMember = new TeamMember({ name, role, specialty, bio, image: imageUrl });
    await newMember.save();
    res.status(201).json(newMember);
  } catch (error) {
    res.status(500).json({ message: 'Server error while creating team member.', error: error.message });
  }
};

export const getTeamMembers = async (req, res) => {
  try {
    const members = await TeamMember.find().sort({ createdAt: 'desc' });
    res.json(members);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateTeamMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, specialty, bio } = req.body;
    let imageUrl;

    if (req.file) {
      imageUrl = await uploadBufferToCloudinary(req.file, 'Aagaur/team');
    }

    const updateData = { name, role, specialty, bio };
    if (imageUrl) {
      updateData.image = imageUrl;
    }

    const updatedMember = await TeamMember.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedMember) return res.status(404).json({ message: 'Team member not found' });

    res.json(updatedMember);
  } catch (error) {
    res.status(500).json({ message: 'Server error while updating team member.', error: error.message });
  }
};

export const deleteTeamMember = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedMember = await TeamMember.findByIdAndDelete(id);
    if (!deletedMember) return res.status(404).json({ message: 'Team member not found' });
    res.json({ message: 'Team member deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// --- Intern Controllers ---

export const createIntern = async (req, res) => {
  try {
    const { name, role, bio } = req.body;
    if (!req.file) {
      return res.status(400).json({ message: 'Image is required.' });
    }

    const imageUrl = await uploadBufferToCloudinary(req.file, 'Aagaur/interns');

    const newIntern = new Intern({ name, role, bio, image: imageUrl });
    await newIntern.save();
    res.status(201).json(newIntern);
  } catch (error) {
    res.status(500).json({ message: 'Server error while creating intern.', error: error.message });
  }
};

export const getInterns = async (req, res) => {
  try {
    const interns = await Intern.find().sort({ createdAt: 'desc' });
    res.json(interns);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateIntern = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, bio } = req.body;
    let imageUrl;

    if (req.file) {
      imageUrl = await uploadBufferToCloudinary(req.file, 'Aagaur/interns');
    }

    const updateData = { name, role, bio };
    if (imageUrl) {
      updateData.image = imageUrl;
    }

    const updatedIntern = await Intern.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedIntern) return res.status(404).json({ message: 'Intern not found' });

    res.json(updatedIntern);
  } catch (error) {
    res.status(500).json({ message: 'Server error while updating intern.', error: error.message });
  }
};

export const deleteIntern = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedIntern = await Intern.findByIdAndDelete(id);
    if (!deletedIntern) return res.status(404).json({ message: 'Intern not found' });
    res.json({ message: 'Intern deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
