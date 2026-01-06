import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
// import mongoose from 'mongoose';



import adminRoutes from './routes/adminRoutes.js';

import connectDB from './config/db.js';

import bookingRoutes from './routes/bookingRoutes.js';
import inquiryRoutes from './routes/inquiryRoutes.js';
import blogRoutes from './routes/blogRoutes.js';
import adminBlogRoutes from './routes/adminBlogRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import adminRoomRoutes from './routes/adminRoomRoutes.js';
import adminSeoRoutes from './routes/adminSeoRoutes.js';
import seoRoutes from './routes/seoRoutes.js';
import adminContactRoutes from './routes/adminContactRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import adminHomeRoutes from './routes/adminHomeRoutes.js';
import homeRoutes from './routes/homeRoutes.js';
import adminGalleryRoutes from './routes/adminGalleryRoutes.js';
import galleryRoutes from './routes/galleryRoutes.js';
import adminAboutRoutes from './routes/adminAboutRoutes.js';
import aboutRoutes from './routes/aboutRoutes.js';
import adminSettingsRoutes from './routes/adminSettingsRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import adminActivityRoutes from './routes/adminActivityRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import { serveRobotsTxt, serveSitemap } from './controllers/seoController.js';

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
    'http://localhost:5176',
    process.env.CLIENT_URL || 'https://arboreal-new.onrender.com',
    'https://thearborealresort.onrender.com',
    'https://thearborealresort.com',
    'https://admin.aagaurstudio.com', 
    'https://www.aagaurstudio.com','https://aagaurstudio.com',// Main frontend on Render
    'https://aagaur-admin.onrender.com',
    'http://admin.thearborealresort.com',
    'https://admin.thearborealresort.com',
     // Admin panel on Render
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
  next();
});

// JSON parsing middleware - skip for multipart/form-data (handled by multer)
app.use((req, res, next) => {
  if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
    return next(); // Skip JSON parsing for multipart requests
  }
  express.json({ limit: '50mb' })(req, res, next);
});

app.use((req, res, next) => {
  if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
    return next(); // Skip urlencoded parsing for multipart requests
  }
  express.urlencoded({ extended: true, limit: '50mb' })(req, res, next);
});

// Serve robots.txt and sitemap.xml BEFORE other routes (important - must be before React routes)
app.get('/robots.txt', serveRobotsTxt);
app.get('/sitemap.xml', serveSitemap);

// Routes that expect JSON
app.use('/api/admin', adminRoutes);

app.use('/api/booking', bookingRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/admin/blogs', adminBlogRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/admin/rooms', adminRoomRoutes);
app.use('/api/admin/seo', adminSeoRoutes);
app.use('/api/seo', seoRoutes);
app.use('/api/admin/contact', adminContactRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/admin/home', adminHomeRoutes);
app.use('/api/home', homeRoutes);
app.use('/api/admin/gallery', adminGalleryRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/admin/about', adminAboutRoutes);
app.use('/api/about', aboutRoutes);
app.use('/api/admin/settings', adminSettingsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/admin/activities', adminActivityRoutes);
app.use('/api/activities', activityRoutes);



// Root endpoint
app.get('/', (req, res) => {
  res.send({ message: 'Aagaur backend running' });
});
app.get("/ping", (req, res) => {
  res.status(200).send("pong");
});


const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

