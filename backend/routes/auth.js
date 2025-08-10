const express = require('express');
const asyncHandler = require('express-async-handler'); // Corrected 'require-async-handler' to 'express-async-handler'
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload'); // <--- IMPORT: Needed for parsing image data
const { passport, generateTokenForGoogleUser } = require('../config/passport-setup');
const cloudinary = require('cloudinary').v2; // <--- IMPORT: Needed for Cloudinary uploads
const Post = require('../models/Post'); // <--- IMPORT: Needed to update author avatars on posts

const router = express.Router();

// Helper function to upload base64 images to Cloudinary
// This function needs to be in auth.js because it's used by the /profile/avatar route
const uploadImage = async (image) => {
  if (!image) return null;
  try {
    const result = await cloudinary.uploader.upload(image, {
      folder: 'confique_avatars', // Use a specific folder for avatars
    });
    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary avatar upload failed:', error);
    return null;
  }
};

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

  const user = await User.create({
    name,
    email,
    password,
    isAdmin: email === 'confique01@gmail.com',
    // Default avatar for newly registered users (non-Google)
    avatar: 'https://placehold.co/40x40/cccccc/000000?text=A', // Or your local placeholder
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
  scope: ['profile', 'email']
}));

// @desc    Google OAuth callback after successful authentication
// @route   GET /api/auth/google/callback
// @access  Public
router.get('/google/callback', passport.authenticate('google', {
  failureRedirect: process.env.FRONTEND_URL + '/login?error=google_failed',
  session: true
}), (req, res) => {
  const token = generateTokenForGoogleUser(req.user);
  // Ensure avatar is always a valid URL or a placeholder
  const avatarUrl = req.user.avatar || 'https://placehold.co/40x40/cccccc/000000?text=A';

  res.redirect(`${process.env.FRONTEND_URL}/?token=${token}&name=${encodeURIComponent(req.user.name)}&email=${encodeURIComponent(req.user.email)}&avatar=${encodeURIComponent(avatarUrl)}&isAdmin=${req.user.isAdmin}&_id=${req.user._id}`);
});


// @desc    Update user avatar
// @route   PUT /api/auth/profile/avatar
// @access  Private (requires authentication)
// <--- ADDED: upload.none() middleware to correctly parse base64 data from req.body
router.put('/profile/avatar', protect, upload.none(), asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    const newAvatar = req.body.avatar;

    if (!newAvatar) {
      return res.status(400).json({ message: 'No avatar provided' });
    }
    
    // Check if the new avatar is a pre-defined asset path or a full URL (like from Google)
    // or a base64 string for a new custom upload.
    if (newAvatar.startsWith('http')) {
        // It's a URL (Google avatar, or a pre-defined asset URL)
        user.avatar = newAvatar;
    } else if (newAvatar.startsWith('data:image')) {
        // Assume this is a base64 string from a custom upload
        const imageUrl = await uploadImage(newAvatar); // Use the local uploadImage helper
        if (imageUrl) {
            // Optional: Delete old avatar from Cloudinary if it was a custom upload
            // This requires storing the public_id when uploading, or parsing it from the URL.
            // For simplicity, we'll skip deletion for now, but it's good practice.
            // if (user.avatar && user.avatar.includes('cloudinary')) {
            //     const publicId = user.avatar.split('/').pop().split('.')[0];
            //     await cloudinary.uploader.destroy(`confique_avatars/${publicId}`);
            // }
            user.avatar = imageUrl;
        } else {
            return res.status(500).json({ message: 'Failed to upload image to Cloudinary' });
        }
    } else {
        // Fallback for unexpected avatar formats, or if it's a local asset path that needs to be resolved
        // For now, setting to a default placeholder if it's not a recognizable URL or base64
        user.avatar = 'https://placehold.co/40x40/cccccc/000000?text=A';
    }

    const updatedUser = await user.save();
    
    // <--- CRUCIAL ADDITION: Update the authorAvatar on all of this user's posts
    await Post.updateMany({ userId: user._id }, { $set: { authorAvatar: updatedUser.avatar } });

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      avatar: updatedUser.avatar, // Return the updated avatar URL
      token: req.headers.authorization.split(' ')[1], 
      isAdmin: updatedUser.isAdmin,
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
}));

module.exports = router;