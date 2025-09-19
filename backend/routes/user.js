// const express = require('express');
// const asyncHandler = require('express-async-handler');
// const { Parser } = require('json2csv'); // NEW: For CSV generation
// const User = require('../models/User');
// const Post = require('../models/Post');
// const Registration = require('../models/Registration'); // NEW: Import the new model
// const Notification = require('../models/Notification');
// const { protect, admin } = require('../middleware/auth');
// const cloudinary = require('cloudinary').v2;

// const router = express.Router();

// // Helper function to upload base64 images to Cloudinary
// const uploadImage = async (image) => {
//     if (!image) return null;
//     try {
//         const result = await cloudinary.uploader.upload(image, {
//             folder: 'confique_avatars',
//         });
//         return result.secure_url;
//     } catch (error) {
//         console.error('Cloudinary avatar upload failed:', error);
//         return null;
//     }
// };

// // @desc    Get user profile
// // @route   GET /api/users/profile
// // @access  Private
// router.get('/profile', protect, asyncHandler(async (req, res) => {
//     const user = await User.findById(req.user._id).select('-password');
//     if (user) {
//         res.json({
//             _id: user._id,
//             name: user.name,
//             email: user.email,
//             avatar: user.avatar,
//             isAdmin: user.isAdmin,
//         });
//     } else {
//         res.status(404);
//         throw new Error('User not found');
//     }
// }));

// // @desc    Update user avatar
// // @route   PUT /api/users/profile/avatar
// // @access  Private
// router.put('/profile/avatar', protect, asyncHandler(async (req, res) => {
//     const user = await User.findById(req.user._id);
//     if (user) {
//         const newAvatar = req.body.avatar;
//         if (!newAvatar) {
//             res.status(400);
//             throw new Error('No avatar provided');
//         }
//         let updatedAvatarUrl = newAvatar;
//         if (newAvatar.startsWith('data:image')) {
//             if (user.avatar && user.avatar.includes('cloudinary')) {
//                 const parts = user.avatar.split('/');
//                 const publicId = `confique_avatars/${parts[parts.length - 1].split('.')[0]}`;
//                 try {
//                     await cloudinary.uploader.destroy(publicId);
//                 } catch (cloudinaryErr) {
//                     console.error('Cloudinary deletion failed for old avatar:', cloudinaryErr);
//                 }
//             }
//             const imageUrl = await uploadImage(newAvatar);
//             if (imageUrl) {
//                 updatedAvatarUrl = imageUrl;
//             } else {
//                 res.status(500);
//                 throw new Error('Failed to upload image to Cloudinary');
//             }
//         }
//         user.avatar = updatedAvatarUrl;
//         const updatedUser = await user.save();
//         await Post.updateMany({ userId: user._id }, { $set: { authorAvatar: updatedUser.avatar } });
//         await Post.updateMany(
//             { 'commentData.userId': user._id },
//             { $set: { 'commentData.$[elem].authorAvatar': updatedUser.avatar } },
//             { arrayFilters: [{ 'elem.userId': user._id }] }
//         );
//         res.json({
//             _id: updatedUser._id,
//             name: updatedUser.name,
//             email: updatedUser.email,
//             avatar: updatedUser.avatar,
//             isAdmin: updatedUser.isAdmin,
//         });
//     } else {
//         res.status(404);
//         throw new Error('User not found');
//     }
// }));

// // @desc    Get a list of all posts the user has liked
// // @route   GET /api/users/liked-posts
// // @access  Private
// router.get('/liked-posts', protect, asyncHandler(async (req, res) => {
//     const likedPosts = await Post.find({ likedBy: req.user._id });
//     const likedPostIds = likedPosts.map(post => post._id);
//     res.json({ likedPostIds });
// }));

// // @desc    Get event IDs the current user has registered for
// // @route   GET /api/users/my-events-registrations
// // @access  Private
// // UPDATED: Now fetches from the new Registration model
// router.get('/my-events-registrations', protect, asyncHandler(async (req, res) => {
//     const userId = req.user._id;
//     const registeredEvents = await Registration.find({ userId: userId }).select('eventId');
//     const registeredEventIds = registeredEvents.map(reg => reg.eventId);
//     res.json({ registeredEventIds });
// }));

// // @desc    Get registration counts for events created by the logged-in user
// // @route   GET /api/users/my-events/registration-counts
// // @access  Private
// // UPDATED: Now gets counts from the new Registration model
// router.get('/my-events/registration-counts', protect, asyncHandler(async (req, res) => {
//     try {
//         const myEvents = await Post.find({ userId: req.user._id, type: 'event' });
//         const registrationCounts = {};
        
//         // Use Promise.all to efficiently count registrations for all events
//         await Promise.all(myEvents.map(async (event) => {
//             const count = await Registration.countDocuments({ eventId: event._id });
//             registrationCounts[event._id] = count;
//         }));

//         res.status(200).json({ registrations: registrationCounts });
//     } catch (error) {
//         console.error('Error in registration-counts route:', error);
//         res.status(500).json({ message: 'Failed to fetch registration counts due to a server error. Check server logs.' });
//     }
// }));

// // @desc    Register for an event
// // @route   POST /api/users/register-event/:eventId
// // @access  Private
// // UPDATED: Now saves to the new Registration model
// router.post('/register-event/:eventId', protect, asyncHandler(async (req, res) => {
//     const { eventId } = req.params;
//     const userId = req.user._id;
//     const { name, email, phone, transactionId, ...customFields } = req.body;

//     // Verify the event and that the user isn't already registered
//     const event = await Post.findById(eventId);
//     if (!event || event.type !== 'event') {
//         res.status(404);
//         throw new Error('Event not found');
//     }
//     const isAlreadyRegistered = await Registration.findOne({ eventId: eventId, userId: userId });
//     if (isAlreadyRegistered) {
//         res.status(400);
//         throw new Error('You are already registered for this event');
//     }

//     try {
//         const newRegistration = await Registration.create({
//             eventId,
//             userId,
//             name,
//             email,
//             phone,
//             customFields: { ...customFields, transactionId: transactionId || '' }
//         });
    
//         const eventCreator = await User.findById(event.userId);
//         if(eventCreator) {
//             const newNotification = new Notification({
//                 recipient: eventCreator._id,
//                 message: `${req.user.name} has registered for your event "${event.title}"!`,
//                 postId: event._id,
//                 type: 'registration',
//                 timestamp: new Date(),
//             });
//             await newNotification.save();
//         }

//         res.status(201).json({ message: 'Registration successful', registration: newRegistration });
//     } catch (error) {
//         console.error('Registration failed:', error);
//         res.status(500).json({ message: 'Server error during registration.' });
//     }
// }));

// // @desc    Admin endpoint to get all reported posts
// // @route   GET /api/users/admin/reported-posts
// // @access  Private, Admin
// router.get('/admin/reported-posts', protect, admin, asyncHandler(async (req, res) => {
//     const reportedPosts = await Notification.find({ type: 'report' })
//         .populate('reporter', 'name email')
//         .populate('postId', 'title content');
//     res.json(reportedPosts);
// }));

// // @desc    Admin endpoint to get all registrations for a specific event
// // @route   GET /api/users/admin/registrations/:eventId
// // @access  Private, Admin
// // UPDATED: Now fetches from the new Registration model
// router.get('/admin/registrations/:eventId', protect, admin, asyncHandler(async (req, res) => {
//     const event = await Post.findById(req.params.eventId);
    
//     if (!event) {
//         return res.status(404).json({ message: 'Event not found' });
//     }

//     // Security check: Only the host or an admin can view this data
//     if (event.userId.toString() !== req.user._id.toString() && !req.user.isAdmin) {
//         return res.status(403).json({ message: 'You are not authorized to view this data.' });
//     }
    
//     const registrations = await Registration.find({ eventId: event._id });
//     res.json(registrations);
// }));

// // @desc    Admin endpoint to delete a post and its reports
// // @route   DELETE /api/users/admin/delete-post/:id
// // @access  Private, Admin
// router.delete('/admin/delete-post/:id', protect, admin, asyncHandler(async (req, res) => {
//     const postId = req.params.id;
//     const post = await Post.findById(postId);

//     if (post) {
//         await post.deleteOne();
//         await Notification.deleteMany({ postId: postId });
//         await Registration.deleteMany({ eventId: postId }); // NEW: Delete registrations when the event is deleted
//         res.json({ message: 'Post and associated data removed' });
//     } else {
//         res.status(404).json({ message: 'Post not found' });
//     }
// }));

// // NEW ROUTE: GET /api/posts/export-registrations/:eventId
// // NOTE: For better organization, this route should ideally be in your posts.js file.
// // But it is included here for a single, comprehensive change.
// router.get('/export-registrations/:eventId', protect, asyncHandler(async (req, res) => {
//     const { eventId } = req.params;

//     const event = await Post.findById(eventId);
//     if (!event) {
//         return res.status(404).json({ message: 'Event not found.' });
//     }
//     if (event.userId.toString() !== req.user._id.toString()) {
//         return res.status(403).json({ message: 'Not authorized to export this data.' });
//     }

//     const registrations = await Registration.find({ eventId });
//     if (registrations.length === 0) {
//         return res.status(404).json({ message: 'No registrations found for this event.' });
//     }

//     // Flatten data and add headers for CSV
//     let customFieldsSet = new Set();
//     registrations.forEach(reg => {
//         Object.keys(reg.customFields).forEach(field => customFieldsSet.add(field));
//     });
//     const customFields = [...customFieldsSet];

//     const fields = ['Name', 'Email', 'Phone', ...customFields, 'Registered At'];

//     const data = registrations.map(reg => {
//         const row = {
//             'Name': reg.name,
//             'Email': reg.email,
//             'Phone': reg.phone,
//             'Registered At': reg.createdAt.toISOString(),
//         };
//         for (const field of customFields) {
//             row[field] = reg.customFields[field] || '';
//         }
//         return row;
//     });

//     try {
//         const json2csvParser = new Parser({ fields });
//         const csv = json2csvParser.parse(data);

//         res.header('Content-Type', 'text/csv');
//         res.attachment(`registrations_${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv`);
//         res.send(csv);
//     } catch (error) {
//         console.error('CSV export error:', error);
//         res.status(500).json({ message: 'Error generating CSV file.' });
//     }
// }));

// module.exports = router;

const express = require('express');
const asyncHandler = require('express-async-handler');
const { Parser } = require('json2csv');
const User = require('../models/User');
const { Post, Registration } = require('../models/Post'); 
const Notification = require('../models/Notification');
const { protect, admin } = require('../middleware/auth');
const cloudinary = require('cloudinary').v2;
const jwt = require('jsonwebtoken');
const multer = require('multer');

const router = express.Router();

// Configure multer to store files in memory for processing with Cloudinary
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

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
        return res.status(400).json({ message: 'You have already registered for this event' });
    }
    
    // Parse JSON strings from the form-data request body
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

    let screenshotUrl = null;
    if (req.file && event.culturalPaymentMethod === 'qr-screenshot') {
        try {
            // Upload the file buffer to Cloudinary
            const result = await cloudinary.uploader.upload(`data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`, {
                folder: 'confique_registrations',
            });
            screenshotUrl = result.secure_url;
        } catch (error) {
            console.error('Cloudinary upload failed:', error);
            return res.status(500).json({ message: 'Failed to upload payment screenshot.' });
        }
    } else if (event.culturalPaymentMethod === 'qr-screenshot' && !req.file) {
        return res.status(400).json({ message: 'A payment screenshot is required for this registration.' });
    }

    const newRegistrationData = {
        eventId,
        userId,
        name,
        email,
        phone,
        transactionId,
        paymentScreenshot: screenshotUrl,
        customFields,
        bookingDates: bookingDates ? JSON.parse(bookingDates) : [],
        selectedTickets: selectedTickets ? JSON.parse(selectedTickets) : [],
        totalPrice: totalPrice ? parseFloat(totalPrice) : 0,
    };
    
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
        res.status(500).json({ message: `Server error during registration: ${error.message}` });
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