const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { Post, Registration } = require('../models/Post'); 
const { protect, admin } = require('../middleware/auth'); 
const User = require('../models/User');
const Notification = require('../models/Notification');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const { Parser } = require('json2csv');

const upload = multer({
    storage: multer.memoryStorage()
});

const uploadImageBuffer = async (buffer) => {
    if (!buffer) return null;
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream({ folder: 'registration_screenshots' }, (error, result) => {
            if (error) {
                console.error('Cloudinary upload failed:', error);
                reject(new Error('Cloudinary upload failed.'));
            } else {
                resolve(result.secure_url);
            }
        });
        streamifier.createReadStream(buffer).pipe(uploadStream);
    });
};

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

// @desc    Get all event IDs a user is registered for
// @route   GET /api/users/my-events-registrations
// @access  Private
router.get('/my-events-registrations', protect, asyncHandler(async (req, res) => {
    const userId = req.user._id;

    try {
        const registrations = await Registration.find({ userId });
        const registeredEventIds = registrations.map(reg => reg.eventId);
        res.status(200).json({ registeredEventIds });
    } catch (error) {
        console.error('Error fetching user registrations:', error);
        res.status(500).json({ message: 'Server error while fetching user registrations.' });
    }
}));

// @desc    Get all registrations for a user's hosted events
// @route   GET /api/users/my-events/registration-counts
// @access  Private
router.get('/my-events/registration-counts', protect, asyncHandler(async (req, res) => {
    try {
        const userEvents = await Post.find({ userId: req.user._id });
        const registrationCounts = {};

        await Promise.all(userEvents.map(async (event) => {
            const count = await Registration.countDocuments({ eventId: event._id });
            registrationCounts[event._id] = count;
        }));

        res.status(200).json({ registrations: registrationCounts });
    } catch (error) {
        console.error('Error fetching registration counts:', error);
        res.status(500).json({ message: 'Server error while fetching registration counts.' });
    }
}));

// @desc    Register for an event
// @route   POST /api/users/register-event/:eventId
// @access  Private
router.post('/register-event/:eventId', protect, upload.single('paymentScreenshot'), asyncHandler(async (req, res) => {
    const { eventId } = req.params;
    const userId = req.user._id;

    console.log('Received registration request for eventId:', eventId);

    try {
        const event = await Post.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found.' });
        }
        
        const isRegistered = await Registration.findOne({ eventId, userId });
        if (isRegistered) {
            return res.status(409).json({ message: 'You are already registered for this event.' });
        }

        const { 
            name, 
            email, 
            phone, 
            transactionId,
            bookingDates,
            selectedTickets,
            totalPrice,
            ...otherFields 
        } = req.body;

        const registrationData = {
            eventId,
            userId,
            name,
            email,
            phone,
            transactionId,
        };

        if (event.type === 'culturalEvent') {
            registrationData.bookingDates = bookingDates ? JSON.parse(bookingDates) : [];
            registrationData.selectedTickets = selectedTickets ? JSON.parse(selectedTickets) : [];
            registrationData.totalPrice = totalPrice ? parseFloat(totalPrice) : 0;
        } else {
             registrationData.totalPrice = totalPrice ? parseFloat(totalPrice) : 0;
        }
        
        if (req.file) {
            const paymentScreenshotUrl = await uploadImageBuffer(req.file.buffer);
            if (paymentScreenshotUrl) {
                registrationData.paymentScreenshot = paymentScreenshotUrl;
                registrationData.paymentStatus = 'under_review';
            }
        } else if (event.type === 'event' && event.price > 0 && event.paymentMethod === 'qr' && !transactionId) {
             return res.status(400).json({ message: 'Transaction ID is required for QR payment.' });
        } else if (event.type === 'culturalEvent' && event.culturalPaymentMethod === 'qr-screenshot' && !req.file) {
             return res.status(400).json({ message: 'Payment screenshot is required for registration.' });
        }
        
        const customFields = {};
        for (const key in otherFields) {
            if (otherFields.hasOwnProperty(key)) {
                customFields[key] = otherFields[key];
            }
        }
        if (Object.keys(customFields).length > 0) {
            registrationData.customFields = customFields;
        }

        const newRegistration = new Registration(registrationData);
        await newRegistration.save();
        
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
        console.error('Registration error:', error);
        
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }

        res.status(500).json({ message: 'Server error during registration.' });
    }
}));

// @desc    Admin endpoints (moved from postsRoutes.js for clarity)
router.get('/admin/pending-events', protect, admin, asyncHandler(async (req, res) => {
    const pendingEvents = await Post.find({ type: { $in: ['event', 'culturalEvent'] }, status: 'pending' }).sort({ timestamp: 1 });
    res.json(pendingEvents);
}));

router.put('/admin/approve-event/:id', protect, admin, asyncHandler(async (req, res) => {
    const event = await Post.findById(req.params.id);
    if (event) {
        if (!['event', 'culturalEvent'].includes(event.type)) {
            return res.status(400).json({ message: 'Only events and cultural events can be approved through this route' });
        }
        event.status = 'approved';
        const updatedEvent = await event.save();
        res.json(updatedEvent);
    } else {
        res.status(404).json({ message: 'Event not found' });
    }
}));

router.delete('/admin/reject-event/:id', protect, admin, asyncHandler(async (req, res) => {
    const event = await Post.findById(req.params.id);
    if (event) {
        if (!['event', 'culturalEvent'].includes(event.type)) {
            return res.status(400).json({ message: 'Only events and cultural events can be rejected through this route' });
        }
        const publicIdsToDelete = [];
        if (event.images && event.images.length > 0) {
            event.images.forEach(url => {
                const parts = url.split('/');
                const filename = parts[parts.length - 1];
                publicIdsToDelete.push(`confique_posts/${filename.split('.')[0]}`);
            });
        }
        const qrCodeUrl = event.type === 'event' ? event.paymentQRCode : event.culturalPaymentQRCode;
        if (qrCodeUrl) {
            const parts = qrCodeUrl.split('/');
            const filename = parts[parts.length - 1];
            publicIdsToDelete.push(`confique_posts/${filename.split('.')[0]}`);
        }
        if (publicIdsToDelete.length > 0) {
            try { await cloudinary.api.delete_resources(publicIdsToDelete); }
            catch (cloudinaryErr) { console.error('Cloudinary deletion failed:', cloudinaryErr); }
        }
        await event.deleteOne();
        await Registration.deleteMany({ eventId: event._id });
        res.json({ message: 'Event rejected and removed' });
    } else {
        res.status(404).json({ message: 'Event not found' });
    }
}));

router.get('/admin/reported-posts', protect, admin, asyncHandler(async (req, res) => {
    const reportedPosts = await Notification.find({ type: 'report' }).populate('reporter', 'name email').populate('postId', 'title content');
    res.json(reportedPosts);
}));

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
    const allFields = new Set();
    const flattenedData = [];
    registrations.forEach(reg => {
        const baseData = {
            'Name': reg.name || '',
            'Email': reg.email || '',
            'Phone': reg.phone || '',
            'Transaction ID': reg.transactionId || '',
            'Payment Screenshot URL': reg.paymentScreenshot || '',
            'Registered At': reg.createdAt.toISOString(),
        };
        Object.keys(baseData).forEach(key => allFields.add(key));
        if (reg.customFields) {
            for (const key in reg.customFields) {
                if (Object.prototype.hasOwnProperty.call(reg.customFields, key)) {
                    baseData[key] = reg.customFields[key] || '';
                    allFields.add(key);
                }
            }
        }
        if (event.type === 'culturalEvent' && reg.selectedTickets && reg.selectedTickets.length > 0) {
            allFields.add('Booking Dates');
            allFields.add('Total Price');
            allFields.add('Ticket Type');
            allFields.add('Ticket Quantity');
            allFields.add('Ticket Price');
            reg.selectedTickets.forEach(ticket => {
                flattenedData.push({
                    ...baseData,
                    'Booking Dates': (reg.bookingDates || []).join(', ') || '',
                    'Total Price': reg.totalPrice || '',
                    'Ticket Type': ticket.ticketType || '',
                    'Ticket Quantity': ticket.quantity || '',
                    'Ticket Price': ticket.ticketPrice || '',
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
    const finalHeaders = Array.from(allFields);
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