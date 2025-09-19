const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { Post, Registration } = require('../models/Post'); 
const { protect } = require('../middleware/auth'); 
const Notification = require('../models/Notification');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier'); // Required for streaming to Cloudinary from memory storage

// Configure multer for memory storage, which is ideal for streaming to cloud services
const upload = multer({
    storage: multer.memoryStorage()
});

// Helper function to upload an image buffer to Cloudinary and return the URL
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

// @desc    Register for an event
// @route   POST /api/users/register-event/:eventId
// @access  Private
// FIX: Use multer middleware to handle file uploads
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

        // Deconstruct fields from req.body (which is now available via multer)
        const { 
            name, 
            email, 
            phone, 
            transactionId,
            bookingDates, // Will be a JSON string from frontend
            selectedTickets, // Will be a JSON string from frontend
            totalPrice, // Will be a string from frontend
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

        // Parse fields that were sent as JSON strings
        if (event.type === 'culturalEvent') {
            registrationData.bookingDates = bookingDates ? JSON.parse(bookingDates) : [];
            registrationData.selectedTickets = selectedTickets ? JSON.parse(selectedTickets) : [];
            registrationData.totalPrice = totalPrice ? parseFloat(totalPrice) : 0;
        } else {
             registrationData.totalPrice = totalPrice ? parseFloat(totalPrice) : 0;
        }

        // Handle the file upload for payment screenshot if it exists
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

        // Dynamically add any other custom fields
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
        
        // Notify the event creator
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

        res.status(201).json({ message: 'Registration successful!', registration: newRegistration });

    } catch (error) {
        console.error('Registration error:', error);
        
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }

        res.status(500).json({ message: 'Server error during registration.' });
    }
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

module.exports = router;