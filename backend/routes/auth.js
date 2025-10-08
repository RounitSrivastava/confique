const express = require('express');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { protect } = require('../middleware/auth');
const { passport, generateTokenForGoogleUser, isGoogleOAuthConfigured } = require('../config/passport-setup');

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
    
    // Validation
    if (!name || !email || !password) {
        res.status(400).json({ message: 'Please add all fields' });
        return;
    }

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
        // ✅ CORRECT: Use object format for avatar
        avatar: {
            url: 'https://placehold.co/40x40/cccccc/000000?text=A',
            publicId: 'default_avatar'
        },
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

    // Validation
    if (!email || !password) {
        res.status(400).json({ message: 'Please add email and password' });
        return;
    }

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

// Only enable Google OAuth routes if configured
if (isGoogleOAuthConfigured()) {
    console.log('Google OAuth is configured - enabling Google routes');
    
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
            console.log('Google OAuth callback successful for user:', req.user?.email);
            
            if (req.user) {
                try {
                    const token = generateTokenForGoogleUser(req.user);
                    // ✅ Handle both string and object avatar formats
                    const avatarUrl = req.user.avatar && typeof req.user.avatar === 'object' 
                        ? req.user.avatar.url 
                        : req.user.avatar || 'https://placehold.co/40x40/cccccc/000000?text=A';
                    
                    const redirectUrl = `${process.env.FRONTEND_URL}/?token=${token}&name=${encodeURIComponent(req.user.name)}&email=${encodeURIComponent(req.user.email)}&avatar=${encodeURIComponent(avatarUrl)}&isAdmin=${req.user.isAdmin}&_id=${req.user._id}`;
                    
                    console.log('Redirecting to frontend:', redirectUrl);
                    res.redirect(redirectUrl);
                } catch (error) {
                    console.error('Error generating token:', error);
                    res.redirect(`${process.env.FRONTEND_URL}/login?error=token_error`);
                }
            } else {
                console.error('Google OAuth callback failed - no user data');
                res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
            }
        }
    );
} else {
    console.log('Google OAuth not configured - skipping Google routes');
}

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
router.get('/profile', protect, asyncHandler(async (req, res) => {
    res.json({
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        avatar: req.user.avatar,
        isAdmin: req.user.isAdmin,
    });
}));

router.get('/', (req, res) => {
    res.json({ 
        message: 'Auth route is working!',
        googleOAuthConfigured: isGoogleOAuthConfigured()
    });
});

module.exports = router;