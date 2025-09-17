// userRoutes.js
const express = require('express');
const router = express.Router();
// Assuming you have a file that exports all your models, or you import them individually
const Post = require('../models/Post'); 
const Registration = require('../models/Registration'); 
const { protect } = require('../middleware/auth'); 

// NEW ROUTE: POST /api/users/register-event/:eventId
// This route saves the registration data to the database.
router.post('/register-event/:eventId', protect, async (req, res) => {
    const { eventId } = req.params;
    const userId = req.user._id;

    console.log('Received registration request for eventId:', eventId);
    console.log('Request Body:', req.body);
    console.log('User ID:', userId);

    try {
        const event = await Post.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found.' });
        }
        
        const isRegistered = await Registration.findOne({ eventId, userId });
        if (isRegistered) {
            return res.status(409).json({ message: 'You are already registered for this event.' });
        }
        
        // Destructure common fields and group the rest into `customFields`
        const { 
            name, 
            email, 
            phone, 
            transactionId,
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

        // Conditionally add cultural event specific fields
        if (event.type === 'culturalEvent') {
            registrationData.bookingDates = otherFields.bookingDates;
            registrationData.selectedTickets = otherFields.selectedTickets;
            registrationData.totalPrice = otherFields.totalPrice;
        }

        // Add custom fields
        const customFields = {};
        for (const key in otherFields) {
            // Exclude fields already handled above
            if (event.type === 'event' && ['bookingDates', 'selectedTickets', 'totalPrice'].includes(key)) {
                // Ignore these fields for regular events
            } else if (otherFields.hasOwnProperty(key)) {
                customFields[key] = otherFields[key];
            }
        }
        if (Object.keys(customFields).length > 0) {
            registrationData.customFields = customFields;
        }

        const newRegistration = new Registration(registrationData);
        await newRegistration.save();

        res.status(201).json({ message: 'Registration successful!', registration: newRegistration });
    } catch (error) {
        console.error('Registration error:', error);
        
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }

        res.status(500).json({ message: 'Server error during registration.' });
    }
});

// ... (other existing userRoutes.js routes) ...

module.exports = router;