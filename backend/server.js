// khrfhd
require('dotenv').config(); // MUST BE THE VERY FIRST LINE
console.log('Server file is being executed!');

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;
const session = require('express-session');
const MongoStore = require('connect-mongo');
const { passport } = require('./config/passport-setup');
const path = require('path');

// Import your route files
const authRoutes = require('./routes/auth');
// const postsRoutes = require('./routes/posts');
// const userRoutes = require('./routes/user');
// const notificationsRoutes = require('./routes/notifications');
// const cronRoutes = require('./routes/cronRoutes');

const app = express();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Middleware
// INCREASED PAYLOAD SIZE LIMIT for JSON
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS Configuration
app.use(cors({
  origin: [process.env.FRONTEND_URL, 'http://localhost:5173', 'https://www.confique.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Session middleware configuration (required for Passport.js)
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'sessions',
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// API Route Handlers
app.use('/api/auth', authRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/cron', cronRoutes);

// Production Static File Serving and Catch-All Route
// This MUST be placed after all API routes.
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, '..', 'frontend', 'dist');

  // Serve the static files from the React app
  app.use(express.static(buildPath));

  // Serve the index.html for all other routes (FIXED: Changed '/*' to '*')
  app.get('/*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

// Basic error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));