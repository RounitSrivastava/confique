// userRoutes.js
const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Post = require('../models/Post'); 
const Registration = require('../models/Registration'); 
const { protect } = require('../middleware/auth'); 

// @desc    Register for an event
// @route   POST /api/users/register-event/:eventId
// @access  Private
router.post('/register-event/:eventId', protect, asyncHandler(async (req, res) => {
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

        if (event.type === 'culturalEvent') {
            registrationData.bookingDates = otherFields.bookingDates;
            registrationData.selectedTickets = otherFields.selectedTickets;
            registrationData.totalPrice = otherFields.totalPrice;
        }

        const customFields = {};
        for (const key in otherFields) {
            if (!['bookingDates', 'selectedTickets', 'totalPrice'].includes(key) && otherFields.hasOwnProperty(key)) {
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
}));


// FIX: This is the new, crucial route that was missing.
// @desc    Get all event IDs a user is registered for
// @route   GET /api/users/my-events-registrations
// @access  Private
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


// @desc    Get all registrations for a user's hosted events
// @route   GET /api/users/my-events/registration-counts
// @access  Private
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