require('dotenv').config();

// Add validation for required environment variables
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.FRONTEND_URL || !process.env.BACKEND_URL) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const express = require('express');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');  // Fix import
const jwt = require('jsonwebtoken');
const { protect } = require('../middleware/auth');
const { passport, generateTokenForGoogleUser } = require('../config/passport-setup');

const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Register a new user (email/password)
router.post('/register', asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400).json({ message: 'User with this email already exists' });
    return;
  }

  const user = await User.create({
    name,
    email,
    password, // Password will be hashed by pre-save hook
    isAdmin: email === 'confique01@gmail.com',
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      token: generateToken(user._id),
      isAdmin: user.isAdmin,
    });
  } else {
    res.status(400).json({ message: 'Invalid user data' });
  }
}));

// Authenticate user & get token (email/password)
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && user.password && (await user.matchPassword(password))) { // Check user.password exists for non-Google users
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      token: generateToken(user._id),
      isAdmin: user.isAdmin,
    });
  } else {
    res.status(401).json({ message: 'Invalid email or password' });
  }
}));

// Google OAuth routes
// Route to initiate Google OAuth login
console.log('Callback URL:', `${process.env.BACKEND_URL}/api/auth/google/callback`);

router.get('/google', (req, res, next) => {
  const callbackURL = `${process.env.BACKEND_URL}/api/auth/google/callback`;
  console.log('Initiating Google OAuth with callback:', callbackURL);
  
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
    callbackURL // Make sure this exactly matches what's in Google Console
  })(req, res, next);
});

// Callback route after Google authentication
router.get('/google/callback', 
  (req, res, next) => {
    const callbackURL = `${process.env.BACKEND_URL}/api/auth/google/callback`;
    console.log('Processing callback at:', callbackURL);
    
    passport.authenticate('google', {
      failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_failed`,
      session: false,
      callbackURL // Same exact URL as above
    })(req, res, next);
  },
  (req, res) => {
    try {
      if (!req.user) {
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_user`);
      }

      const token = generateTokenForGoogleUser(req.user);
      const queryParams = new URLSearchParams({
        token,
        name: req.user.name,
        email: req.user.email,
        avatar: req.user.avatar || '',
        isAdmin: req.user.isAdmin,
        _id: req.user._id
      }).toString();

      res.redirect(`${process.env.FRONTEND_URL}/?${queryParams}`);
    } catch (error) {
      console.error('Google auth callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
    }
  }
);

// Update user profile (for avatar)
router.put('/profile/avatar', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.avatar = req.body.avatar || user.avatar;

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      avatar: updatedUser.avatar,
      token: req.headers.authorization.split(' ')[1], // Return the same token
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
}));

module.exports = router;  // Change to CommonJS export