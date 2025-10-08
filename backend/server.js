require('dotenv').config(); // MUST BE THE VERY FIRST LINE

console.log('Server file is being executed!');

// DEBUG: Check if environment variables are loading
console.log('=== ENVIRONMENT VARIABLES DEBUG ===');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✅ Loaded' : '❌ Missing');
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '✅ Loaded' : '❌ Missing');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ Loaded' : '❌ Missing');
console.log('MONGO_URI:', process.env.MONGO_URI ? '✅ Loaded' : '❌ Missing');
console.log('====================================');

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;
const session = require('express-session');
const MongoStore = require('connect-mongo');
const { passport } = require('./config/passport-setup');
const path = require('path');

// Import your route files - WITH .js EXTENSIONS
const authRoutes = require('./routes/auth.js');
const postsRoutes = require('./routes/postRoutes.js');
const userRoutes = require('./routes/userRoutes.js');
const notificationsRoutes = require('./routes/notifications.js');
const cronRoutes = require('./routes/cronRoutes.js');

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
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS Configuration
app.use(cors({
  origin: [process.env.FRONTEND_URL, 'http://localhost:5173', 'https://www.confique.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Session middleware configuration
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

// Test basic route first
app.get('/test', (req, res) => {
  res.json({ message: 'Server working' });
});
console.log('✅ Basic test route registered');

// Load routes one by one with error handling
console.log('Loading routes one by one...');

const loadRoute = (name, path, mountPath) => {
  try {
    console.log(`Loading ${name}...`);
    const route = require(path);
    app.use(mountPath, route);
    console.log(`✅ ${name} loaded successfully`);
    return true;
  } catch (error) {
    console.error(`❌ ${name} failed:`, error.message);
    return false;
  }
};

// Load routes individually
loadRoute('Auth routes', './routes/auth.js', '/api/auth');
loadRoute('Post routes', './routes/postRoutes.js', '/api/posts');
loadRoute('User routes', './routes/userRoutes.js', '/api/users');
loadRoute('Notification routes', './routes/notifications.js', '/api/notifications');
loadRoute('Cron routes', './routes/cronRoutes.js', '/api/cron');

console.log('All routes loaded, starting server...');

// Production Static File Serving and Catch-All Route
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, '..', 'frontend', 'dist');
  
  // Serve the static files from the React app
  app.use(express.static(buildPath));
  
  // Serve the index.html for all other routes
  app.get('*', (req, res) => {
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