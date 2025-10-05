const express = require('express');
const asyncHandler = require('express-async-handler');
const { Parser } = require('json2csv');
const User = require('../models/User');
const { Post, Registration } = require('../models/Post'); 
const Notification = require('../models/Notification');
const { protect, admin } = require('../middleware/auth');
const cloudinary = require('cloudinary').v2;

const router = express.Router();

// CORRECTED HELPER: Returns object { url, publicId } to match schema
const uploadImage = async (image, folderName) => {
    if (!image) return null;
    try {
        const result = await cloudinary.uploader.upload(image, {
            folder: folderName || 'confique_uploads',
        });
        // FIX: Return object { url, publicId } for database compatibility
        return { url: result.secure_url, publicId: result.public_id };
    } catch (error) {
        console.error('Cloudinary upload failed:', error);
        return null;
    }
};

// NEW HELPER: Safely deletes resources by public ID
const deleteCloudinaryResources = async (publicIds) => {
    if (!publicIds || publicIds.length === 0) return;
    try {
        await cloudinary.api.delete_resources(publicIds);
        console.log(`Successfully deleted resources: ${publicIds.join(', ')}`);
    } catch (cloudinaryErr) {
        console.error('Cloudinary deletion failed:', cloudinaryErr);
    }
};

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
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    const newAvatar = req.body.avatar;
    if (!newAvatar) {
        res.status(400);
        throw new Error('No avatar provided');
    }

    let updatedAvatarData = newAvatar;

    // Check if the input is a new Base64 string that needs uploading
    if (typeof newAvatar === 'string' && newAvatar.startsWith('data:image')) {
        // Safely get old publicId from the database object
        const oldPublicId = user.avatar?.publicId; 
        if (oldPublicId && oldPublicId !== 'default_avatar') {
            await deleteCloudinaryResources([oldPublicId]);
        }

        updatedAvatarData = await uploadImage(newAvatar, 'confique_avatars');
        if (!updatedAvatarData) {
            res.status(500);
            throw new Error('Failed to upload new avatar image');
        }
    } else if (typeof newAvatar === 'object' && newAvatar.url && newAvatar.publicId) {
        // If the user selected a pre-defined avatar (which is sent as a {url, publicId} object)
        updatedAvatarData = newAvatar;
    }

    // Assign the new object (or pre-defined object) to the user
    user.avatar = updatedAvatarData;
    const updatedUser = await user.save();
    
    // Update all posts and comments (using the URL part for legacy string fields)
    const newAvatarUrl = updatedUser.avatar.url;

    await Post.updateMany({ userId: user._id }, { $set: { authorAvatar: newAvatarUrl } });
    await Post.updateMany(
        { 'commentData.userId': user._id },
        { $set: { 'commentData.$[elem].authorAvatar': newAvatarUrl } },
        { arrayFilters: [{ 'elem.userId': user._id }] }
    );

    res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        // Send the full object back to the client
        avatar: updatedUser.avatar, 
        isAdmin: updatedUser.isAdmin,
    });
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
    const myEvents = await Post.find({ userId: req.user._id, type: { $in: ['event', 'culturalEvent'] } });
    const registrationCounts = {};
    
    await Promise.all(myEvents.map(async (event) => {
        const count = await Registration.countDocuments({ eventId: event._id });
        registrationCounts[event._id] = count;
    }));

    res.status(200).json({ registrations: registrationCounts });
}));

// @desc    Register for an event
// @route   POST /api/users/register-event/:eventId
// @access  Private
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

// @desc    Export registrations for a specific event to a CSV file
// @route   GET /api/users/export-registrations/:eventId
// @access  Private (Event host or Admin)
router.get('/export-registrations/:eventId', protect, asyncHandler(async (req, res) => {
    const { eventId } = req.params;

    const event = await Post.findById(eventId);
    if (!event) {
        return res.status(404).json({ message: 'Event not found.' });
    }
    if (event.userId.toString() !== req.user._id.toString() && !req.user.isAdmin) {
        return res.status(403).json({ message: 'Not authorized to export this data.' });
    }

    const registrations = await Registration.find({ eventId }).lean();
    if (registrations.length === 0) {
        return res.status(404).json({ message: 'No registrations found for this event.' });
    }

    const headers = new Set(['Name', 'Email', 'Phone', 'Transaction ID', 'Registered At']);
    const flattenedData = [];

    registrations.forEach(reg => {
        const baseData = {
            'Name': reg.name,
            'Email': reg.email,
            'Phone': reg.phone || '',
            'Transaction ID': reg.transactionId || '',
            'Registered At': reg.createdAt.toISOString(),
        };

        if (reg.customFields) {
            for (const key of Object.keys(reg.customFields)) {
                baseData[key] = reg.customFields[key] || '';
                headers.add(key);
            }
        }
        
        if (reg.selectedTickets && reg.selectedTickets.length > 0) {
            headers.add('Booking Dates');
            headers.add('Ticket Type');
            headers.add('Ticket Quantity');
            headers.add('Ticket Price');
            headers.add('Total Price');
            
            reg.selectedTickets.forEach(ticket => {
                flattenedData.push({
                    ...baseData,
                    'Booking Dates': (reg.bookingDates || []).join(', ') || '',
                    'Ticket Type': ticket.ticketType || '',
                    'Ticket Quantity': ticket.quantity || '',
                    'Ticket Price': ticket.ticketPrice || '',
                    'Total Price': reg.totalPrice || '',
                });
            });
        } else {
            flattenedData.push({
                ...baseData,
                'Booking Dates': (reg.bookingDates || []).join(', ') || '',
                'Total Price': reg.totalPrice || '',
                'Ticket Type': '',
                'Ticket Quantity': '',
                'Ticket Price': '',
            });
        }
    });

    const finalHeaders = Array.from(headers);

    try {
        const json2csvParser = new Parser({ fields: finalHeaders });
        const csv = json2csvParser.parse(flattenedData);

        res.header('Content-Type', 'text/csv');
        res.attachment(`registrations_${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv`);
        res.send(csv);
    } catch (error) {
        console.error('CSV export error:', error);
        res.status(500).json({ message: 'Error generating CSV file.' });
    }
}));

module.exports = router;
