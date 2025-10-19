require('dotenv').config(); // MUST BE THE VERY FIRST LINE

console.log('Server file is being executed!');

// DEBUG: Check if environment variables are loading
console.log('=== ENVIRONMENT VARIABLES DEBUG ===');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✅ Loaded' : '❌ Missing');
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '✅ Loaded' : '❌ Missing');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ Loaded' : '❌ Missing');
console.log('MONGO_URI:', process.env.MONGO_URI ? '✅ Loaded' : '❌ Missing');
console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME ? '✅ Loaded' : '❌ Missing');
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

// Configure Cloudinary with error handling
try {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log('✅ Cloudinary configured with cloud_name:', process.env.CLOUDINARY_CLOUD_NAME);
} catch (error) {
  console.warn('⚠️ Cloudinary configuration failed:', error.message);
}

// Connect to MongoDB - REMOVED DEPRECATED OPTIONS
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/startup-showcase')
  .then(() => {
    console.log('✅ MongoDB connected successfully');
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1); // Exit if database connection fails
  });

// MongoDB connection event handlers
mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

mongoose.connection.on('connected', () => {
  console.log('📊 MongoDB connection established');
});

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS Configuration - Updated for showcase
app.use(cors({
  origin: [
    process.env.FRONTEND_URL, 
    'http://localhost:5173', 
    'http://localhost:3000',
    'https://www.confique.com',
    'https://confique.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Handle preflight requests
app.options('*', cors());

// Session middleware configuration with fallback
app.use(session({
  secret: process.env.SESSION_SECRET || 'startup-showcase-secret-key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI || 'mongodb://localhost:27017/startup-showcase',
    collectionName: 'sessions',
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Test basic route first
app.get('/test', (req, res) => {
  res.json({ 
    message: 'Startup Showcase Server working',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});
console.log('✅ Basic test route registered');

// Health check endpoint for showcase
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
  
  res.status(200).json({
    status: 'OK',
    service: 'Startup Showcase API',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: dbStatus,
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

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

// Showcase-specific endpoints
app.get('/api/showcase/submission-status', (req, res) => {
  const SUBMISSION_DEADLINE = new Date('2025-10-31T23:59:59').getTime();
  const now = new Date().getTime();
  const isPostingEnabled = now < SUBMISSION_DEADLINE;
  
  res.json({
    isPostingEnabled,
    deadline: '2025-10-31T23:59:59',
    daysRemaining: Math.ceil((SUBMISSION_DEADLINE - now) / (1000 * 60 * 60 * 24)),
    currentTime: new Date().toISOString()
  });
});

console.log('All routes loaded, starting server...');

// Production Static File Serving and Catch-All Route - FIXED VERSION
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, '..', 'frontend', 'dist');
  
  // Check if build directory exists
  const fs = require('fs');
  if (fs.existsSync(buildPath)) {
    // Serve the static files from the React app
    app.use(express.static(buildPath));
    
    // Serve the index.html for all other routes (EXCEPT API routes)
    app.get('*', (req, res, next) => {
      // Skip API routes - let Express handle these
      if (req.path.startsWith('/api/')) {
        return next();
      }
      
      // For all other routes, serve the React app
      res.sendFile(path.join(buildPath, 'index.html'));
    });
    
    console.log('✅ Production static file serving configured');
  } else {
    console.warn('⚠️ Frontend build directory not found:', buildPath);
    console.log('💡 Run "npm run build" in the frontend directory to generate production build');
  }
}

// Enhanced error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation Error',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({
      message: 'Invalid ID format'
    });
  }
  
  // Handle CORS errors
  if (err.name === 'CorsError') {
    return res.status(403).json({
      message: 'CORS Error: Request blocked'
    });
  }
  
  res.status(500).json({
    message: 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    message: 'API endpoint not found',
    path: req.originalUrl
  });
});

const PORT = process.env.PORT || 5000;

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT. Shutting down gracefully...');
  await mongoose.connection.close();
  console.log('✅ MongoDB connection closed.');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM. Shutting down gracefully...');
  await mongoose.connection.close();
  console.log('✅ MongoDB connection closed.');
  process.exit(0);
});

// Wait for MongoDB to connect before starting server
const startServer = () => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Startup Showcase Server running on port ${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 CORS enabled for frontend: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
    console.log(`📊 Database: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
  });
};

// Start server immediately, but log connection status
startServer();