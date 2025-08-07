require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;
const session = require('express-session'); // New
const { passport } = require('./config/passport-setup'); // New

const authRoutes = require('./routes/auth');
const postsRoutes = require('./routes/posts');
const userRoutes = require('./routes/user');

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
  .catch(err => console.error(err));

// Middleware
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173', // Your frontend URL (Vite default)
  credentials: true // Allow cookies/sessions to be sent
}));

// Session middleware (required for Passport)
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS in production
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session()); // Persistent login sessions

// Serve static images from the 'uploads' folder (if still needed, though Cloudinary handles main images)
// app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Uncomment if you have other local uploads

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));