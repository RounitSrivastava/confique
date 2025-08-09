require('dotenv').config(); // MUST BE THE VERY FIRST LINE
console.log('Server file is being executed!');

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;
const session = require('express-session');
const { passport } = require('./config/passport-setup'); // Path to your passport setup

// Import your route files
const authRoutes = require('./routes/auth');
const postsRoutes = require('./routes/posts');
const userRoutes = require('./routes/user');
// IMPORTANT: No 'notificationsRoutes' import here, as that file does not exist.

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
  .catch(err => console.error('MongoDB connection error:', err)); // Added more specific error logging

// Middleware
app.use(express.json()); // For parsing application/json
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded (if needed)

// CORS Configuration
// Allows requests from your frontend URLs.
// IMPORTANT: Adjust 'origin' based on your frontend's deployment.
// If frontend is local: 'http://localhost:5173'
// If frontend is deployed: 'https://your-frontend-domain.com'
// If both: ['http://localhost:5173', 'https://your-frontend-domain.com']
app.use(cors({
  origin: [process.env.FRONTEND_URL, 'http://localhost:5173', 'https://confique.onrender.com'], // Add all possible frontend origins
  credentials: true, // Allow cookies to be sent
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allowed HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
}));

// Session middleware configuration (required for Passport.js)
app.use(session({
  secret: process.env.SESSION_SECRET, // Your strong, random session secret from .env
  resave: false, // Don't save session if unmodified
  saveUninitialized: false, // Don't create session until something is stored
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production (HTTPS)
    sameSite: 'lax', // Protects against CSRF attacks
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session()); // Enable persistent login sessions

// Route Handlers
app.use('/api/auth', authRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/users', userRoutes);
// IMPORTANT: No 'app.use('/api/notifications', notificationsRoutes);' here.

// Basic error handling middleware (optional, but good practice)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));