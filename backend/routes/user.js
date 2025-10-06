const express = require('express');
const asyncHandler = require('express-async-handler');
const { Parser } = require('json2csv');
const User = require('../models/User');
// FIX: Correctly import both Post and Registration models from the consolidated file
const { Post, Registration } = require('../models/Post'); 
const Notification = require('../models/Notification');
const { protect, admin } = require('../middleware/auth');
const cloudinary = require('cloudinary').v2;

const router = express.Router();

// Helper function to upload base64 images to Cloudinary
const uploadImage = async (image, folderName) => {
    if (!image) return null;
    try {
        const result = await cloudinary.uploader.upload(image, {
            folder: folderName || 'confique_uploads',
        });
        return result.secure_url;
    } catch (error) {
        console.error('Cloudinary upload failed:', error);
        return null;
    }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
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

// @desc    Update user avatar
// @route   PUT /api/users/profile/avatar
// @access  Private
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
                const parts = user.avatar.split('/');
                const publicId = `confique_avatars/${parts[parts.length - 1].split('.')[0]}`;
                try {
                    await cloudinary.uploader.destroy(publicId);
                } catch (cloudinaryErr) {
                    console.error('Cloudinary deletion failed for old avatar:', cloudinaryErr);
                }
            }
            const imageUrl = await uploadImage(newAvatar, 'confique_avatars');
            if (imageUrl) {
                updatedAvatarUrl = imageUrl;
            } else {
                res.status(500);
                throw new Error('Failed to upload image to Cloudinary');
            }
        }
        user.avatar = updatedAvatarUrl;
        const updatedUser = await user.save();
        
        // Update user avatar across all posts they authored
        await Post.updateMany({ userId: user._id }, { $set: { authorAvatar: updatedUser.avatar } });
        
        // Update user avatar in all comments they made (using arrayFilters for efficiency)
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

// @desc    Get a list of all posts the user has liked
// @route   GET /api/users/liked-posts
// @access  Private
router.get('/liked-posts', protect, asyncHandler(async (req, res) => {
    const likedPosts = await Post.find({ likedBy: req.user._id });
    const likedPostIds = likedPosts.map(post => post._id);
    res.json({ likedPostIds });
}));

// @desc    Get event IDs the current user has registered for
// @route   GET /api/users/my-events-registrations
// @access  Private
router.get('/my-events-registrations', protect, asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const registeredEvents = await Registration.find({ userId: userId }).select('eventId');
    const registeredEventIds = registeredEvents.map(reg => reg.eventId);
    res.json({ registeredEventIds });
}));

// @desc    Get registration counts for events created by the logged-in user
// @route   GET /api/users/my-events/registration-counts
// @access  Private
router.get('/my-events/registration-counts', protect, asyncHandler(async (req, res) => {
    // Removed redundant try...catch block
    const myEvents = await Post.find({ userId: req.user._id, type: { $in: ['event', 'culturalEvent'] } });
    const registrationCounts = {};
    
    await Promise.all(myEvents.map(async (event) => {
        const count = await Registration.countDocuments({ eventId: event._id });
        registrationCounts[event._id] = count;
    }));

    res.status(200).json({ registrations: registrationCounts });
}));

// @desc    Register for an event
// @route   POST /api/users/register-event/:eventId
// @access  Private
router.post('/register-event/:eventId', protect, asyncHandler(async (req, res) => {
    const { eventId } = req.params;
    const userId = req.user._id;

    const event = await Post.findById(eventId);
    if (!event) {
        res.status(404);
        throw new Error('Event not found');
    }

    const isAlreadyRegistered = await Registration.findOne({ eventId: eventId, userId: userId });
    if (isAlreadyRegistered) {
        res.status(400);
        throw new Error('You are already registered for this event');
    }

    const { 
        name, 
        email, 
        phone, 
        transactionId,
        bookingDates,
        selectedTickets,
        totalPrice,
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
        bookingDates,
        selectedTickets,
        totalPrice
    };

    // Removed redundant try...catch block
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
}));

// @desc    Admin endpoint to get all reported posts
// @route   GET /api/users/admin/reported-posts
// @access  Private, Admin
router.get('/admin/reported-posts', protect, admin, asyncHandler(async (req, res) => {
    const reportedPosts = await Notification.find({ type: 'report' })
        .populate('reporter', 'name email')
        .populate('postId', 'title content');
    res.json(reportedPosts);
}));

// @desc    Admin endpoint to get all registrations for a specific event
// @route   GET /api/users/admin/registrations/:eventId
// @access  Private, Admin
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

// @desc    Admin endpoint to delete a post and its reports
// @route   DELETE /api/users/admin/delete-post/:id
// @access  Private, Admin
router.delete('/admin/delete-post/:id', protect, admin, asyncHandler(async (req, res) => {
    const postId = req.params.id;
    const post = await Post.findById(postId);

    if (post) {
        // NOTE: Cleanup of Cloudinary resources should be done here if the post has images/QR codes.
        // Assuming this cleanup logic is handled by a separate generic function or not required here.
        await post.deleteOne();
        await Notification.deleteMany({ postId: postId });
        await Registration.deleteMany({ eventId: postId });
        res.json({ message: 'Post and associated data removed' });
    } else {
        res.status(404).json({ message: 'Post not found' });
    }
}));

// @desc    Export registrations for a specific event to a CSV file
// @route   GET /api/users/export-registrations/:eventId
// @access  Private (Event host or Admin)
router.get('/export-registrations/:eventId', protect, asyncHandler(async (req, res) => {
    const { eventId } = req.params;

    // 1. Verify the user is the host of the event or an admin
    const event = await Post.findById(eventId);
    if (!event) {
        return res.status(404).json({ message: 'Event not found.' });
    }
    if (event.userId.toString() !== req.user._id.toString() && !req.user.isAdmin) {
        return res.status(403).json({ message: 'Not authorized to export this data.' });
    }

    // 2. Fetch all registration data for the event
    const registrations = await Registration.find({ eventId }).lean();
    if (registrations.length === 0) {
        return res.status(404).json({ message: 'No registrations found for this event.' });
    }

    // 3. Dynamically discover all unique custom and standard fields and flatten the data
    const headers = new Set(['Name', 'Email', 'Registered At']);
    
    // Add all possible headers upfront
    ['Phone', 'Transaction ID', 'Booking Dates', 'Total Price', 'Ticket Type', 'Ticket Quantity', 'Ticket Price'].forEach(h => headers.add(h));


    // Gather all unique custom fields
    registrations.forEach(reg => {
        if (reg.customFields) {
            Object.keys(reg.customFields).forEach(key => headers.add(key));
        }
    });

    const finalHeaders = Array.from(headers);
    
    const data = registrations.flatMap(reg => {
        const baseRow = {
            'Name': reg.name || '',
            'Email': reg.email || '',
            'Registered At': reg.createdAt ? reg.createdAt.toISOString() : '',
            'Phone': reg.phone || '',
            'Transaction ID': reg.transactionId || '',
            'Booking Dates': (reg.bookingDates || []).join(', ') || '',
            'Total Price': reg.totalPrice || '',
        };
        
        // Add all custom fields dynamically to the base row
        if (reg.customFields) {
            for (const key of Object.keys(reg.customFields)) {
                baseRow[key] = reg.customFields[key] || '';
            }
        }

        if (reg.selectedTickets && reg.selectedTickets.length > 0) {
            return reg.selectedTickets.map(ticket => ({
                ...baseRow,
                'Ticket Type': ticket.ticketType || '',
                'Ticket Quantity': ticket.quantity || '',
                'Ticket Price': ticket.ticketPrice || '',
            }));
        } else {
            // Standard/single row if no ticket data
            return [{
                ...baseRow,
                'Ticket Type': '',
                'Ticket Quantity': '',
                'Ticket Price': '',
            }];
        }
    });

    try {
        const json2csvParser = new Parser({ fields: finalHeaders });
        const csv = json2csvParser.parse(data);

        res.header('Content-Type', 'text/csv');
        const safeTitle = event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 50);
        res.attachment(`registrations_${safeTitle}_${eventId}.csv`);
        res.send(csv);
    } catch (error) {
        console.error('CSV export error:', error);
        res.status(500).json({ message: 'Error generating CSV file.' });
    }
}));


module.exports = router;
