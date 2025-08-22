const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler'); // ADDED: Import asyncHandler
const User = require('../models/User');

// @desc    Protect routes for authenticated users
// @access  Private
const protect = asyncHandler(async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Find user by ID and attach to request object
            req.user = await User.findById(decoded.id).select('-password');
            
            next();
        } catch (error) {
            console.error("[Auth Middleware] JWT verification failed:", error.message);
            res.status(401);
            throw new Error('Not authorized, token failed');
        }
    }
    if (!token) {
        res.status(401);
        throw new Error('Not authorized, no token');
    }
});

// @desc    Restrict access to only administrators
// @access  Private (Admin only)
const admin = (req, res, next) => {
    if (req.user && req.user.isAdmin) {
        next();
    } else {
        res.status(403);
        throw new Error('Not authorized as an admin');
    }
};

module.exports = { protect, admin };