const express = require('express');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { protect } = require('../middleware/auth');
const { passport, generateTokenForGoogleUser } = require('../config/passport-setup'); // New import

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
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'] // Request profile and email access
}));

// Callback route after Google authentication
router.get('/google/callback', passport.authenticate('google', {
  failureRedirect: 'http://localhost:5173/login?error=google_failed', // Redirect on failure
  session: true // Passport uses sessions
}), (req, res) => {
  // Successful authentication, generate JWT and redirect to frontend
  const token = generateTokenForGoogleUser(req.user);
  // Redirect to frontend with token in URL (or set as cookie)
  // For simplicity, redirecting with token in URL hash or query for frontend to pick up
  res.redirect(`http://localhost:5173/?token=${token}&name=${encodeURIComponent(req.user.name)}&email=${encodeURIComponent(req.user.email)}&avatar=${encodeURIComponent(req.user.avatar || '')}&isAdmin=${req.user.isAdmin}&_id=${req.user._id}`);
});


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

module.exports = router;