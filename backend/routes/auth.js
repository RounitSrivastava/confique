const express = require('express');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Post = require('../models/Post');
const jwt = require('jsonwebtoken');
const { protect } = require('../middleware/auth');
const { passport, generateTokenForGoogleUser, isGoogleOAuthConfigured } = require('../config/passport-setup');

const router = express.Router();

// Helper function to generate a standard JWT for local users
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Helper function to validate password strength
const validatePassword = (password) => {
    if (password.length < 6) {
        return 'Password must be at least 6 characters long';
    }
    return null;
};

// Helper function to ensure consistent avatar format
const normalizeAvatar = (avatar) => {
    console.log('🔄 Normalizing avatar:', avatar);
    
    if (!avatar || avatar === 'undefined' || avatar === 'null') {
        console.log('❌ No avatar provided, using default');
        return {
            url: 'https://placehold.co/40x40/cccccc/000000?text=A',
            publicId: 'default_avatar'
        };
    }
    
    // If avatar is already an object with url, return as-is
    if (typeof avatar === 'object' && avatar.url) {
        console.log('✅ Avatar is object with URL:', avatar.url);
        return avatar;
    }
    
    // If avatar is a string, convert to object format
    if (typeof avatar === 'string') {
        console.log('✅ Avatar is string, converting to object:', avatar);
        return {
            url: avatar,
            publicId: avatar.includes('cloudinary') ? `custom_avatar_${Date.now()}` : 'external_avatar'
        };
    }
    
    // Fallback
    console.log('⚠️ Avatar format unknown, using default');
    return {
        url: 'https://placehold.co/40x40/cccccc/000000?text=A',
        publicId: 'default_avatar'
    };
};

// Add this new function to ensure consistent avatar URL extraction
const getAvatarUrl = (avatar) => {
    if (!avatar) {
        return 'https://placehold.co/40x40/cccccc/000000?text=A';
    }
    
    // Handle both object and string formats
    if (typeof avatar === 'object' && avatar.url) {
        return avatar.url;
    }
    
    if (typeof avatar === 'string') {
        return avatar;
    }
    
    return 'https://placehold.co/40x40/cccccc/000000?text=A';
};

// @desc    Register a new user with email and password
// @route   POST /api/auth/register
// @access  Public
router.post('/register', asyncHandler(async (req, res) => {
    try {
        const { name, email, password, avatar } = req.body;
        
        console.log('📝 Registration attempt:', { name, email, avatar });

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({ 
                message: 'Please add all fields: name, email, and password' 
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                message: 'Please provide a valid email address' 
            });
        }

        // Validate password strength
        const passwordError = validatePassword(password);
        if (passwordError) {
            return res.status(400).json({ 
                message: passwordError 
            });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ 
                message: 'User with this email already exists' 
            });
        }

        // Create user with normalized avatar
        const normalizedAvatar = normalizeAvatar(avatar);
        console.log('✅ Creating user with avatar:', normalizedAvatar);

        const user = await User.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password,
            isAdmin: email.toLowerCase() === 'confique01@gmail.com',
            avatar: normalizedAvatar
        });

        if (user) {
            // Use the new getAvatarUrl function for consistent response
            const avatarUrl = getAvatarUrl(user.avatar);
            console.log('✅ User created successfully with avatar:', avatarUrl);
            
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                avatar: avatarUrl, // Always return string URL
                token: generateToken(user._id),
                isAdmin: user.isAdmin,
            });
        } else {
            res.status(400).json({ 
                message: 'Invalid user data' 
            });
        }
    } catch (error) {
        console.error('Registration error:', error);
        
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ 
                message: `Validation failed: ${messages.join(', ')}` 
            });
        }
        
        res.status(500).json({ 
            message: 'Server error during registration',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}));

// @desc    Authenticate user with email and password & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', asyncHandler(async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('🔐 Login attempt for:', email);

        // Validation
        if (!email || !password) {
            return res.status(400).json({ 
                message: 'Please add email and password' 
            });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });

        if (!user) {
            return res.status(401).json({ 
                message: 'Invalid email or password' 
            });
        }

        // Check if user has a password (OAuth users might not have one)
        if (!user.password) {
            return res.status(401).json({ 
                message: 'This email is registered with Google OAuth. Please use Google login.' 
            });
        }

        const isPasswordValid = await user.matchPassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ 
                message: 'Invalid email or password' 
            });
        }

        // ✅ FIX: Use the new getAvatarUrl function
        const avatarUrl = getAvatarUrl(user.avatar);
        console.log('✅ Login successful, returning avatar:', avatarUrl);

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            avatar: avatarUrl,
            token: generateToken(user._id),
            isAdmin: user.isAdmin,
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            message: 'Server error during login',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}));

// Only enable Google OAuth routes if configured
if (isGoogleOAuthConfigured()) {
    console.log('Google OAuth is configured - enabling Google routes');
    
    // @desc    Initiate Google OAuth login
// @route   GET /api/auth/google
// @access  Public
    router.get('/google', passport.authenticate('google', {
        scope: ['profile', 'email'],
        prompt: 'select_account' // Force account selection
    }));

    // @desc    Google OAuth callback after successful authentication
// @route   GET /api/auth/google/callback
// @access  Public
    router.get('/google/callback', 
        passport.authenticate('google', {
            failureRedirect: process.env.FRONTEND_URL + '/login?error=google_auth_failed',
            session: true
        }), 
        (req, res) => {
            try {
                console.log('Google OAuth callback successful for user:', req.user?.email);
                
                if (!req.user) {
                    console.error('Google OAuth callback failed - no user data');
                    return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_user_data`);
                }

                const token = generateTokenForGoogleUser(req.user);
                
                // ✅ FIX: Use the new getAvatarUrl function
                const avatarUrl = getAvatarUrl(req.user.avatar);
                console.log('✅ Google OAuth avatar:', avatarUrl);
                
                // Build redirect URL with user data
                const redirectParams = new URLSearchParams({
                    token: token,
                    name: encodeURIComponent(req.user.name),
                    email: encodeURIComponent(req.user.email),
                    avatar: encodeURIComponent(avatarUrl),
                    isAdmin: req.user.isAdmin ? 'true' : 'false',
                    _id: req.user._id.toString()
                });

                const redirectUrl = `${process.env.FRONTEND_URL}/?${redirectParams.toString()}`;
                
                console.log('✅ Redirecting to frontend with OAuth success');
                res.redirect(redirectUrl);
            } catch (error) {
                console.error('Error in Google OAuth callback:', error);
                res.redirect(`${process.env.FRONTEND_URL}/login?error=token_generation_failed`);
            }
        }
    );
} else {
    console.log('Google OAuth not configured - skipping Google routes');
    
    // Provide informative responses if Google OAuth is not configured
    router.get('/google', (req, res) => {
        res.status(501).json({ 
            message: 'Google OAuth is not configured on this server' 
        });
    });
}

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
router.get('/profile', protect, asyncHandler(async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (!user) {
            return res.status(404).json({ 
                message: 'User not found' 
            });
        }

        // ✅ FIX: Use the new getAvatarUrl function
        const avatarUrl = getAvatarUrl(user.avatar);
        console.log('👤 Profile fetched, avatar:', avatarUrl);

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            avatar: avatarUrl,
            isAdmin: user.isAdmin,
        });
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ 
            message: 'Server error fetching profile',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}));

// @desc    Get user data for showcase (minimal profile)
// @route   GET /api/auth/showcase-profile
// @access  Private
router.get('/showcase-profile', protect, asyncHandler(async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('name email avatar upvotedPosts bookmarkedPosts')
            .populate('upvotedPosts', 'title month')
            .populate('bookmarkedPosts', 'title month');
            
        if (!user) {
            return res.status(404).json({ 
                message: 'User not found' 
            });
        }

        const avatarUrl = getAvatarUrl(user.avatar);

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            avatar: avatarUrl,
            showcaseStats: {
                upvotedCount: user.upvotedPosts?.length || 0,
                bookmarkedCount: user.bookmarkedPosts?.length || 0
            }
        });
    } catch (error) {
        console.error('Showcase profile fetch error:', error);
        res.status(500).json({ 
            message: 'Server error fetching showcase profile'
        });
    }
}));

// @desc    Check if user can submit to showcase (deadline & limits)
// @route   GET /api/auth/can-submit-showcase
// @access  Private
router.get('/can-submit-showcase', protect, asyncHandler(async (req, res) => {
    try {
        const SUBMISSION_DEADLINE = new Date('2025-10-31T23:59:59').getTime();
        const now = new Date().getTime();
        const isPostingEnabled = now < SUBMISSION_DEADLINE;

        // Optional: Check if user has reached submission limit
        const userShowcaseCount = await Post.countDocuments({ 
            userId: req.user._id, 
            type: 'showcase' 
        });
        
        const maxSubmissions = 5; // Adjust as needed
        const canSubmitMore = userShowcaseCount < maxSubmissions;

        res.json({
            canSubmit: isPostingEnabled && canSubmitMore,
            deadline: '2025-10-31T23:59:59',
            daysRemaining: Math.ceil((SUBMISSION_DEADLINE - now) / (1000 * 60 * 60 * 24)),
            submissionsCount: userShowcaseCount,
            maxSubmissions: maxSubmissions,
            reason: !isPostingEnabled ? 'Submissions closed' : 
                   !canSubmitMore ? 'Submission limit reached' : 'Can submit'
        });
    } catch (error) {
        console.error('Can submit check error:', error);
        res.status(500).json({ 
            message: 'Server error checking submission status'
        });
    }
}));

// @desc    Check if user exists (for password reset flow)
// @route   POST /api/auth/check-user
// @access  Public
router.post('/check-user', asyncHandler(async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ 
                message: 'Email is required' 
            });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        
        if (!user) {
            return res.status(404).json({ 
                message: 'No account found with this email address' 
            });
        }

        res.json({
            exists: true,
            hasPassword: !!user.password, // Check if user has local password
            isOAuth: !user.password // Check if user is OAuth-only
        });
    } catch (error) {
        console.error('Check user error:', error);
        res.status(500).json({ 
            message: 'Server error checking user',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}));

// @desc    Debug route to check avatar handling
// @route   GET /api/auth/debug-avatar
// @access  Private
router.get('/debug-avatar', protect, asyncHandler(async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ 
                message: 'User not found' 
            });
        }

        res.json({
            user: {
                _id: user._id,
                name: user.name,
                email: user.email
            },
            avatar: {
                raw: user.avatar,
                type: typeof user.avatar,
                isObject: typeof user.avatar === 'object',
                hasUrl: user.avatar && typeof user.avatar === 'object' && user.avatar.url,
                extractedUrl: getAvatarUrl(user.avatar)
            },
            database: {
                avatarField: user.avatar
            }
        });
    } catch (error) {
        console.error('Debug avatar error:', error);
        res.status(500).json({ 
            message: 'Debug error',
            error: error.message 
        });
    }
}));

// Health check route
router.get('/', (req, res) => {
    res.json({ 
        message: 'Auth API is working!',
        googleOAuthConfigured: isGoogleOAuthConfigured(),
        timestamp: new Date().toISOString()
    });
});

module.exports = router;