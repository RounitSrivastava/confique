const express = require('express');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { protect } = require('../middleware/auth');
// Ensure this path is correct: from 'routes' folder, go up to 'backend', then into 'config'
const { passport, generateTokenForGoogleUser } = require('../config/passport-setup');

const router = express.Router();

// Helper function to generate a standard JWT for local users
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register a new user with email and password
// @route   POST /api/auth/register
// @access  Public
router.post('/register', asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400).json({ message: 'User with this email already exists' });
    return;
  }

  // Create user. The pre-save hook in User model will hash the password.
  const user = await User.create({
    name,
    email,
    password,
    isAdmin: email === 'confique01@gmail.com', // Grant admin access to this specific email
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

// @desc    Authenticate user with email and password & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  // Check if user exists AND if they have a password (i.e., not a Google-only user)
  // Then match the provided password
  if (user && user.password && (await user.matchPassword(password))) {
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

// @desc    Initiate Google OAuth login
// @route   GET /api/auth/google
// @access  Public
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'] // Request user's profile and email from Google
}));

// @desc    Google OAuth callback after successful authentication
// @route   GET /api/auth/google/callback
// @access  Public
router.get('/google/callback', passport.authenticate('google', {
  failureRedirect: process.env.FRONTEND_URL + '/login?error=google_failed', // Redirect to frontend login page on failure
  session: true // Passport uses sessions to manage authentication state
}), (req, res) => {
  // Successful authentication, req.user contains the authenticated user from passport-setup
  const token = generateTokenForGoogleUser(req.user); // Generate JWT for the Google user

  // Redirect back to the frontend with user data and token in URL parameters
  // The frontend will parse these parameters to log the user in.
  res.redirect(`${process.env.FRONTEND_URL}/?token=${token}&name=${encodeURIComponent(req.user.name)}&email=${encodeURIComponent(req.user.email)}&avatar=${encodeURIComponent(req.user.avatar || '')}&isAdmin=${req.user.isAdmin}&_id=${req.user._id}`);
});


// @desc    Update user avatar
// @route   PUT /api/auth/profile/avatar
// @access  Private (requires authentication)
router.put('/profile/avatar', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id); // req.user is populated by 'protect' middleware

  if (user) {
    user.avatar = req.body.avatar || user.avatar; // Update avatar if provided

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      avatar: updatedUser.avatar,
      // Return the same token or a new one if you want to refresh it
      token: req.headers.authorization.split(' ')[1], 
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
}));

module.exports = router;