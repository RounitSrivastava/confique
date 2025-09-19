const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const { Post, Registration } = require('../models/Post'); 
const Notification = require('../models/Notification');
const { protect, admin } = require('../middleware/auth');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const fs = require('fs');

// Configure multer for temporary file storage
const upload = multer({ dest: 'uploads/' });

// Helper function to upload file paths or data URLs to Cloudinary
const uploadFileToCloudinary = async (file, folderName) => {
    if (!file) {
        console.error('No file provided to uploadFileToCloudinary');
        return null;
    }

    try {
        const uploadOptions = { folder: folderName || 'confique_uploads' };
        let result;

        if (typeof file === 'string' && file.startsWith('data:image')) {
            result = await cloudinary.uploader.upload(file, uploadOptions);
        } else if (typeof file === 'string' && fs.existsSync(file)) {
            result = await cloudinary.uploader.upload(file, uploadOptions);
            fs.unlinkSync(file); // Clean up temp file
        } else {
            console.error('Invalid file type provided to uploadFileToCloudinary');
            return null;
        }

        return result.secure_url;
    } catch (error) {
        console.error('Cloudinary upload failed:', error);
        return null;
    }
};

// --- USER ROUTES ---

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
router.get('/profile', protect, asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('-password');
    if (user) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            isAdmin: user.isAdmin,
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
}));

// @desc    Update user avatar
// @route   PUT /api/users/profile/avatar
// @access  Private
router.put('/profile/avatar', protect, asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (user) {
        const newAvatar = req.body.avatar;
        if (!newAvatar) {
            res.status(400);
            throw new Error('No avatar provided');
        }
        let updatedAvatarUrl = newAvatar;
        if (newAvatar.startsWith('data:image')) {
            if (user.avatar && user.avatar.includes('cloudinary')) {
                const publicId = user.avatar.split('/').pop().split('.')[0];
                try {
                    await cloudinary.uploader.destroy(`confique_avatars/${publicId}`);
                } catch (cloudinaryErr) {
                    console.error('Cloudinary deletion failed for old avatar:', cloudinaryErr);
                }
            }
            const imageUrl = await uploadFileToCloudinary(newAvatar, 'confique_avatars');
            if (imageUrl) {
                updatedAvatarUrl = imageUrl;
            } else {
                res.status(500);
                throw new Error('Failed to upload image to Cloudinary');
            }
        }
        user.avatar = updatedAvatarUrl;
        const updatedUser = await user.save();
        await Post.updateMany({ userId: user._id }, { $set: { authorAvatar: updatedUser.avatar } });
        await Post.updateMany(
            { 'commentData.userId': user._id },
            { $set: { 'commentData.$[elem].authorAvatar': updatedUser.avatar } },
            { arrayFilters: [{ 'elem.userId': user._id }] }
        );
        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            avatar: updatedUser.avatar,
            isAdmin: updatedUser.isAdmin,
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
}));

// @desc    Get a list of all posts the user has liked
// @route   GET /api/users/liked-posts
// @access  Private
router.get('/liked-posts', protect, asyncHandler(async (req, res) => {
    const likedPosts = await Post.find({ likedBy: req.user._id });
    const likedPostIds = likedPosts.map(post => post._id);
    res.json({ likedPostIds });
}));

// @desc    Get event IDs the current user has registered for
// @route   GET /api/users/my-events-registrations
// @access  Private
router.get('/my-events-registrations', protect, asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const registeredEvents = await Registration.find({ userId: userId }).select('eventId');
    const registeredEventIds = registeredEvents.map(reg => reg.eventId);
    res.json({ registeredEventIds });
}));

// @desc    Get registration counts for events created by the logged-in user
// @route   GET /api/users/my-events/registration-counts
// @access  Private
router.get('/my-events/registration-counts', protect, asyncHandler(async (req, res) => {
    try {
        const myEvents = await Post.find({ userId: req.user._id, type: { $in: ['event', 'culturalEvent'] } });
        const registrationCounts = {};
        
        await Promise.all(myEvents.map(async (event) => {
            const count = await Registration.countDocuments({ eventId: event._id });
            registrationCounts[event._id] = count;
        }));

        res.status(200).json({ registrations: registrationCounts });
    } catch (error) {
        console.error('Error in registration-counts route:', error);
        res.status(500).json({ message: 'Failed to fetch registration counts due to a server error. Check server logs.' });
    }
}));

// @desc    Register for an event
// @route   POST /api/users/register-event/:eventId
// @access  Private
router.post('/register-event/:eventId', protect, upload.single('paymentScreenshot'), asyncHandler(async (req, res) => {
    const { eventId } = req.params;
    const userId = req.user._id;

    const event = await Post.findById(eventId);
    if (!event) {
        return res.status(404).json({ message: 'Event not found' });
    }

    const isAlreadyRegistered = await Registration.findOne({ eventId: eventId, userId: userId });
    if (isAlreadyRegistered) {
        return res.status(400).json({ message: 'You are already registered for this event' });
    }

    // Defensive parsing for multipart/form-data fields
    const { 
        name, 
        email, 
        phone, 
        transactionId,
        bookingDates: bookingDatesString,
        selectedTickets: selectedTicketsString,
        totalPrice: totalPriceString,
        ...customFields
    } = req.body;

    const newRegistrationData = {
        eventId,
        userId,
        name,
        email,
        phone,
        transactionId,
        customFields,
        // Ensure parsing is handled safely
        bookingDates: bookingDatesString ? JSON.parse(bookingDatesString) : undefined,
        selectedTickets: selectedTicketsString ? JSON.parse(selectedTicketsString) : undefined,
        totalPrice: totalPriceString ? parseFloat(totalPriceString) : undefined,
        paymentScreenshot: undefined,
    };
    
    // Check for required fields before proceeding
    if (!newRegistrationData.name || !newRegistrationData.email) {
        return res.status(400).json({ message: 'Missing required fields: name and email.' });
    }

    if (req.file) {
        const imageUrl = await uploadFileToCloudinary(req.file.path, 'confique_payment_screenshots');
        if (imageUrl) {
            newRegistrationData.paymentScreenshot = imageUrl;
        } else {
            return res.status(500).json({ message: 'Failed to upload payment screenshot' });
        }
    }

    try {
        const newRegistration = await Registration.create(newRegistrationData);
    
        const eventCreator = await User.findById(event.userId);
        if(eventCreator) {
            const newNotification = new Notification({
                recipient: eventCreator._id,
                message: `${req.user.name} has registered for your event "${event.title}"!`,
                postId: event._id,
                type: 'registration',
                timestamp: new Date(),
            });
            await newNotification.save();
        }

        res.status(201).json({ message: 'Registration successful', registration: newRegistration });
    } catch (error) {
        console.error('Registration failed:', error);
        // Provide a more specific error message from the validation
        if (error.name === 'ValidationError') {
             const messages = Object.values(error.errors).map(val => val.message);
             return res.status(400).json({ message: `Validation failed: ${messages.join(', ')}` });
        }
        // Fallback for other server errors
        return res.status(500).json({ message: `Server error during registration: ${error.message}` });
    }
}));

// @desc    Admin endpoint to get all reported posts
// @route   GET /api/users/admin/reported-posts
// @access  Private, Admin
router.get('/admin/reported-posts', protect, admin, asyncHandler(async (req, res) => {
    const reportedPosts = await Notification.find({ type: 'report' })
        .populate('reporter', 'name email')
        .populate('postId', 'title content');
    res.json(reportedPosts);
}));

// @desc    Admin endpoint to get all registrations for a specific event
// @route   GET /api/users/admin/registrations/:eventId
// @access  Private, Admin
router.get('/admin/registrations/:eventId', protect, asyncHandler(async (req, res) => {
    const event = await Post.findById(req.params.eventId);
    if (!event) {
        return res.status(404).json({ message: 'Event not found' });
    }
    if (event.userId.toString() !== req.user._id.toString() && !req.user.isAdmin) {
        return res.status(403).json({ message: 'You are not authorized to view this data.' });
    }
    const registrations = await Registration.find({ eventId: event._id });
    res.json(registrations);
}));

// @desc    Admin endpoint to delete a post and its reports
// @route   DELETE /api/users/admin/delete-post/:id
// @access  Private, Admin
router.delete('/admin/delete-post/:id', protect, admin, asyncHandler(async (req, res) => {
    const postId = req.params.id;
    const post = await Post.findById(postId);
    if (post) {
        await post.deleteOne();
        await Notification.deleteMany({ postId: postId });
        await Registration.deleteMany({ eventId: postId });
        res.json({ message: 'Post and associated data removed' });
    } else {
        res.status(404).json({ message: 'Post not found' });
    }
}));

module.exports = router;