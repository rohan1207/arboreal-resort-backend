import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';

import projectRoutes from './routes/projectRoutes.js';
import { eventRoutes } from './routes/eventRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import careerRoutes from './routes/careerRoutes.js';
import connectDB from './config/db.js';
import videoRoutes from './routes/videoRoutes.js';
import teamRoutes from './routes/teamRoutes.js';
import heroImageRoutes from './routes/heroImageRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';

// Load env vars
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
const corsOptions = {
  origin: [
    'http://localhost:5174', // Local dev ports
    'http://localhost:5173',
    'http://localhost:5175',
    process.env.CLIENT_URL || 'https://arboreal-new.onrender.com',
    'https://admin.aagaurstudio.com', 
    'https://www.aagaurstudio.com','https://aagaurstudio.com',// Main frontend on Render
    'https://aagaur-admin.onrender.com', // Admin panel on Render
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
};
// Handle preflight requests for all routes
app.options('*', cors(corsOptions)); // This is crucial for PUT/DELETE requests

app.use(cors(corsOptions));


// Add global request logging middleware
app.use((req, res, next) => {
  if (req.path.startsWith('/api/projects')) {
    console.log(`[SERVER] ${req.method} ${req.path} - Request hit server`);
    console.log('[SERVER] Request body size:', req.get('Content-Length') || 'Unknown');
    console.log('[SERVER] User-Agent:', req.get('User-Agent'));
  }
  next();
});

// File upload routes (mutler)
app.use('/api/projects', projectRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/hero-image', heroImageRoutes);

// JSON parsing middleware - should be after file upload routes
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes that expect JSON
app.use('/api/admin', adminRoutes);
app.use('/api/careers', careerRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/booking', bookingRoutes);



// Root endpoint
app.get('/', (req, res) => {
  res.send({ message: 'Aagaur backend running' });
});
app.get("/ping", (req, res) => {
  res.status(200).send("pong");
});


const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
