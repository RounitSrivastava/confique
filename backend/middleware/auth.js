const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// Token verification with better error handling
const verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        // Differentiate between different JWT errors
        if (error.name === 'TokenExpiredError') {
            throw new Error('Token expired');
        } else if (error.name === 'JsonWebTokenError') {
            throw new Error('Invalid token');
        } else {
            throw new Error('Token verification failed');
        }
    }
};

// @desc    Protect routes for authenticated users
// @access  Private
const protect = asyncHandler(async (req, res, next) => {
    let token;
    
    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            
            // Verify token with enhanced error handling
            const decoded = verifyToken(token);
            
            // Find user by ID and attach to request object
            req.user = await User.findById(decoded.id).select('-password');
            
            if (!req.user) {
                console.error("[Auth Middleware] User not found for ID:", decoded.id);
                res.status(401);
                throw new Error('Not authorized, user not found');
            }
            
            // Add user session info for logging/analytics
            req.userSession = {
                userId: req.user._id,
                isAdmin: req.user.isAdmin,
                timestamp: new Date()
            };
            
            console.log(`[Auth] User ${req.user._id} authenticated successfully`);
            next();
            
        } catch (error) {
            console.error("[Auth Middleware] Authentication failed:", error.message);
            
            // Provide more specific error messages
            if (error.message === 'Token expired') {
                res.status(401);
                throw new Error('Not authorized, token expired');
            } else if (error.message === 'Invalid token') {
                res.status(401);
                throw new Error('Not authorized, invalid token');
            } else {
                res.status(401);
                throw new Error('Not authorized, authentication failed');
            }
        }
    } else {
        console.error("[Auth Middleware] No token provided");
        res.status(401);
        throw new Error('Not authorized, no token provided');
    }
});

// @desc    Optional authentication - attaches user if token exists, but doesn't require it
// @access  Optional
const optional = asyncHandler(async (req, res, next) => {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = verifyToken(token);
            req.user = await User.findById(decoded.id).select('-password');
            
            if (req.user) {
                req.userSession = {
                    userId: req.user._id,
                    isAdmin: req.user.isAdmin,
                    timestamp: new Date()
                };
                console.log(`[Auth] Optional auth - User ${req.user._id} authenticated`);
            }
        } catch (error) {
            // For optional auth, we just log the error but don't block the request
            console.warn("[Auth Middleware] Optional authentication failed:", error.message);
            // Continue without user context
        }
    }
    
    next();
});

// @desc    Restrict access to only administrators
// @access  Private (Admin only)
const admin = asyncHandler(async (req, res, next) => {
    if (req.user && req.user.isAdmin) {
        console.log(`[Auth] Admin access granted for user ${req.user._id}`);
        next();
    } else {
        console.warn(`[Auth] Admin access denied for user ${req.user?._id || 'unknown'}`);
        res.status(403);
        throw new Error('Not authorized as an administrator');
    }
});

// @desc    Restrict access to showcase participants or admins
// @access  Private (Showcase participants or Admin)
const showcaseParticipantOrAdmin = asyncHandler(async (req, res, next) => {
    if (!req.user) {
        res.status(401);
        throw new Error('Authentication required');
    }
    
    // Allow admins
    if (req.user.isAdmin) {
        return next();
    }
    
    // Check if user has showcase posts (basic participation check)
    // You can enhance this with more specific checks
    const showcasePostCount = await require('../models/Post').countDocuments({
        userId: req.user._id,
        type: 'showcase'
    });
    
    if (showcasePostCount > 0) {
        console.log(`[Auth] Showcase participant access granted for user ${req.user._id}`);
        next();
    } else {
        console.warn(`[Auth] Showcase access denied for user ${req.user._id}`);
        res.status(403);
        throw new Error('Not authorized - showcase participation required');
    }
});

// @desc    Check if user owns the resource or is admin
// @access  Private (Resource owner or Admin)
const ownerOrAdmin = (resourceUserIdField = 'userId') => {
    return asyncHandler(async (req, res, next) => {
        if (!req.user) {
            res.status(401);
            throw new Error('Authentication required');
        }
        
        // Allow admins
        if (req.user.isAdmin) {
            return next();
        }
        
        // Get resource from request (could be req.post, req.idea, etc.)
        const resource = req.post || req.idea || req.resource;
        
        if (!resource) {
            res.status(404);
            throw new Error('Resource not found');
        }
        
        // Check if user owns the resource
        const resourceUserId = resource[resourceUserIdField] || resource.userId;
        
        if (resourceUserId && resourceUserId.toString() === req.user._id.toString()) {
            console.log(`[Auth] Resource owner access granted for user ${req.user._id}`);
            next();
        } else {
            console.warn(`[Auth] Resource access denied for user ${req.user._id}`);
            res.status(403);
            throw new Error('Not authorized to access this resource');
        }
    });
};

// Rate limiting helper (can be integrated with express-rate-limit)
const createRateLimitKey = (req) => {
    return req.user ? `user:${req.user._id}` : `ip:${req.ip}`;
};

module.exports = { 
    protect, 
    admin, 
    optional,
    showcaseParticipantOrAdmin,
    ownerOrAdmin,
    createRateLimitKey
};