// routes/auth.js (Final Corrected Version)

const express = require('express');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { protect } = require('../middleware/auth');
// Removed 'upload' as it's no longer needed in this file after moving avatar logic
// Removed 'cloudinary' as it's no longer needed in this file after moving avatar logic
const { passport, generateTokenForGoogleUser } = require('../config/passport-setup');
// Removed 'Post' as it's no longer needed in this file after moving avatar logic

const router = express.Router();

// Removed the uploadImage helper function as it's no longer used in this file.

// Helper function to generate a standard JWT for local users
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register a new user with email and password
// @route   POST /api/auth/register
// @access  Public
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

// @desc    Authenticate user with email and password & get token
// @route   POST /api/auth/login
// @access  Public
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

// @desc    Initiate Google OAuth login
// @route   GET /api/auth/google
// @access  Public
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

// @desc    Google OAuth callback after successful authentication
// @route   GET /api/auth/google/callback
// @access  Public
router.get('/google/callback', passport.authenticate('google', {
    failureRedirect: process.env.FRONTEND_URL + '/login?error=google_failed',
    session: true
}), (req, res) => {
    const token = generateTokenForGoogleUser(req.user);
    // Ensure avatar is always a valid URL or a placeholder
    const avatarUrl = req.user.avatar || 'https://placehold.co/40x40/cccccc/000000?text=A';

    res.redirect(`${process.env.FRONTEND_URL}/?token=${token}&name=${encodeURIComponent(req.user.name)}&email=${encodeURIComponent(req.user.email)}&avatar=${encodeURIComponent(avatarUrl)}&isAdmin=${req.user.isAdmin}&_id=${req.user._id}`);
});

// The PUT /profile/avatar route and its logic have been removed from this file.

module.exports = router;