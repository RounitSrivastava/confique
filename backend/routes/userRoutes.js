// userRoutes.js
const express = require('express');
const router = express.Router();
const Registration = require('../models/Registration'); 
const Post = require('../models/Post'); 
const { protect } = require('../middleware/auth'); 

// NEW ROUTE: POST /api/users/register-event/:eventId
// This route saves the registration data to the database.
router.post('/register-event/:eventId', protect, async (req, res) => {
    const { eventId } = req.params;
    const { name, email, phone, ...otherFields } = req.body;

    console.log('Received cultural event registration request for eventId:', eventId);
    console.log('Request Body:', req.body);
    console.log('User ID:', req.user._id);

    try {
        const event = await Post.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found.' });
        }
        
        // This check needs to be more robust. Let's assume you're checking against a
        // User's `registeredEvents` array, not a separate `Registration` model for simplicity.
        // If you are using a separate `Registration` model as in the original code, this line is fine.
        const isRegistered = await Registration.findOne({ eventId, userId: req.user._id });
        if (isRegistered) {
            return res.status(409).json({ message: 'You are already registered for this event.' });
        }

        // Create the base registration object
        const registrationData = {
            name,
            email,
            phone,
            ...otherFields,
        };

        const newRegistration = await Registration.create({
            eventId,
            userId: req.user._id,
            registrationData,
            // The registrationData field in your Mongoose schema must be of type Mixed
        });

        // We can also trigger a notification for the event host here
        // e.g., await Notification.create({ userId: event.userId, message: `${name} has registered for your event "${event.title}"`});

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

// NEW ROUTE: GET /api/users/my-events/registration-counts
// This route fetches the registration count for all events a user has hosted.
router.get('/my-events/registration-counts', protect, async (req, res) => {
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
});

// ... (other existing routes in userRoutes.js)

module.exports = router;