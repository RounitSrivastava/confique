// Add these new imports at the top of the file
const Registration = require('../models/Registration'); 
const Post = require('../models/Post'); // Assuming you have a Post model

// ... (existing imports like express, protect middleware, etc.)

// NEW ROUTE: POST /api/users/register-event/:eventId
// This route saves the registration data to the database.
router.post('/register-event/:eventId', protect, async (req, res) => {
    const { eventId } = req.params;
    const { name, email, phone, ...customFields } = req.body;

    // Verify the event and that the user isn't already registered
    const event = await Post.findById(eventId);
    if (!event) {
        return res.status(404).json({ message: 'Event not found.' });
    }
    const isRegistered = await Registration.findOne({ eventId, userId: req.user._id });
    if (isRegistered) {
        return res.status(409).json({ message: 'You are already registered for this event.' });
    }

    try {
        const newRegistration = await Registration.create({
            eventId,
            userId: req.user._id,
            name,
            email,
            phone,
            customFields,
        });

        // We can also trigger a notification for the event host here
        // e.g., await Notification.create({ userId: event.userId, message: `${name} has registered for your event "${event.title}"`});

        res.status(201).json({ message: 'Registration successful!', registration: newRegistration });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration.' });
    }
});

// NEW ROUTE: GET /api/users/my-events/registration-counts
// This route fetches the registration count for all events a user has hosted.
router.get('/my-events/registration-counts', protect, async (req, res) => {
    try {
        const userEvents = await Post.find({ userId: req.user._id });
        const registrationCounts = {};

        // Use Promise.all to efficiently count registrations for all events
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