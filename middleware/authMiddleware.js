import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import dotenv from 'dotenv';

dotenv.config();

export const protect = async (req, res, next) => {
  let token = req.headers.authorization && req.headers.authorization.startsWith('Bearer')
    ? req.headers.authorization.split(' ')[1]
    : null;

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
    const admin = await Admin.findById(decoded.id).select('-password');
    if (!admin) return res.status(401).json({ message: 'Not authorized' });
    req.admin = admin;
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: 'Token failed' });
  }
};
