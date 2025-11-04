import Admin from '../models/Admin.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'secret123', { expiresIn: '30d' });

// @desc    Login admin
// @route   POST /api/admin/login
// @access  Public
export const loginAdmin = async (req, res) => {
  const { username, password } = req.body;
  try {
    const admin = await Admin.findOne({ username });
    if (admin && (await admin.matchPassword(password))) {
      return res.json({
        _id: admin._id,
        username: admin.username,
        name: admin.name,
        token: generateToken(admin._id),
      });
    }
    res.status(401).json({ message: 'Invalid credentials' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Optional endpoint for creating admin user (disable in prod)
export const registerAdmin = async (req, res) => {
  const { username, password, name } = req.body;
  try {
    const exists = await Admin.findOne({ username });
    if (exists) return res.status(400).json({ message: 'Admin already exists' });
    const admin = await Admin.create({ username, password, name });
    res.status(201).json({
      _id: admin._id,
      username: admin.username,
      name: admin.name,
      token: generateToken(admin._id),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
