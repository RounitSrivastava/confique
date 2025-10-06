const express = require('express');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { protect } = require('../middleware/auth');
const { passport, generateTokenForGoogleUser } = require('../config/passport-setup'); // Correct import

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

    const user = await User.create({
        name,
        email,
        password,
        isAdmin: email === 'confique01@gmail.com',
        avatar: 'https://placehold.co/40x40/cccccc/000000?text=A',
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
router.get('/google/callback', 
    passport.authenticate('google', {
        failureRedirect: process.env.FRONTEND_URL + '/login?error=google_failed',
        session: true
    }), 
    (req, res) => {
        // This block only runs on successful authentication
        if (req.user) {
            const token = generateTokenForGoogleUser(req.user);
            const avatarUrl = req.user.avatar || 'https://placehold.co/40x40/cccccc/000000?text=A';

            // Use res.redirect() to send user back to the client with data in the URL
            res.redirect(`${process.env.FRONTEND_URL}/?token=${token}&name=${encodeURIComponent(req.user.name)}&email=${encodeURIComponent(req.user.email)}&avatar=${encodeURIComponent(avatarUrl)}&isAdmin=${req.user.isAdmin}&_id=${req.user._id}`);
        } else {
            // Fallback if req.user is somehow not set (should not happen with the middleware)
            res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
        }
    }
);

// The PUT /profile/avatar route and its logic have been removed from this file.
router.get('/', (req, res) => {
  res.send('Auth route is working!');
});
module.exports = router;