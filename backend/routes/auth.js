require('dotenv').config();
console.log('Server file is being executed!'); // Add this line
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;
const session = require('express-session');
const { passport } = require('./config/passport-setup'); 

// Correct the import statement for authRoutes
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
  origin: process.env.FRONTEND_URL, 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], 
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Session middleware configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,  
  cookie: { 
    secure: process.env.NODE_ENV === 'production', 
    sameSite: 'lax'  
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session()); 

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));