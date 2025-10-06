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

console.log('Express version:', require('express/package.json').version);

const app = express();

// ---------------------
// Cloudinary Config
// ---------------------
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ---------------------
// MongoDB Connection
// ---------------------
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ---------------------
// Middleware
// ---------------------
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ---------------------
// CORS Config
// ---------------------
app.use(cors({
  origin: [process.env.FRONTEND_URL, 'http://localhost:5173', 'https://www.confique.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ---------------------
// Session Config
// ---------------------
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
    maxAge: 1000 * 60 * 60 * 24, // 1 day
  },
}));

// ---------------------
// Passport Init
// ---------------------
app.use(passport.initialize());
app.use(passport.session());

// ---------------------
// Import Route Files
// ---------------------
const authRoutes = require('./routes/auth');
const postsRoutes = require('./routes/postRoutes');
const userRoutes = require('./routes/userRoutes');
const notificationsRoutes = require('./routes/notifications');
const cronRoutes = require('./routes/cronRoutes');

// ---------------------
// API Routes
// ---------------------
app.use('/api/auth', authRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/cron', cronRoutes);

// ---------------------
// Production: Serve Frontend
// ---------------------
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, '..', 'frontend', 'dist');

  // Serve static assets
  app.use(express.static(buildPath));

  // ✅ FIXED: Express v5 wildcard route syntax
  app.get('/*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

// ---------------------
// Basic Error Handling
// ---------------------
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(500).send('Something broke!');
});

// ---------------------
// Start Server
// ---------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
