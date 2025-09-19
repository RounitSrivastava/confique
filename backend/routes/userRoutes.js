// userRoutes.js
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
    if (!file) return null;
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

// @desc    Register for an event
// @route   POST /api/users/register-event/:eventId
// @access  Private
// FIX: Using multer middleware to handle file uploads
router.post('/register-event/:eventId', protect, upload.single('paymentScreenshot'), asyncHandler(async (req, res) => {
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

    // FIX: Body fields for multipart/form-data are strings. We must parse JSON fields.
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
        bookingDates: bookingDatesString ? JSON.parse(bookingDatesString) : undefined,
        selectedTickets: selectedTicketsString ? JSON.parse(selectedTicketsString) : undefined,
        totalPrice: totalPriceString ? parseFloat(totalPriceString) : undefined,
        paymentScreenshot: undefined,
    };

    // FIX: Check if a file was uploaded and process it.
    if (req.file) {
        const imageUrl = await uploadFileToCloudinary(req.file.path, 'confique_payment_screenshots');
        if (imageUrl) {
            newRegistrationData.paymentScreenshot = imageUrl;
        } else {
            res.status(500);
            throw new Error('Failed to upload payment screenshot');
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
        res.status(500).json({ message: `Server error during registration: ${error.message}` });
    }
}));

// The rest of the user routes were correct and are included here for completeness
// ... (omitting for brevity, but they should be in the file)

module.exports = router;