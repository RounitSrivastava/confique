const express = require('express');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const { protect, admin } = require('../middleware/auth');
const upload = require('../middleware/upload'); // Assuming this is for file uploads, though not directly used in the provided routes
const cloudinary = require('cloudinary').v2;

const router = express.Router();

// Helper function to upload base64 images to Cloudinary
const uploadImage = async (image) => {
    if (!image) return null;
    try {
        const result = await cloudinary.uploader.upload(image, {
            folder: 'confique_avatars', // Ensure this folder exists or is desired
        });
        return result.secure_url;
    } catch (error) {
        console.error('Cloudinary avatar upload failed:', error);
        return null;
    }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
router.get('/profile', protect, asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (user) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            isAdmin: user.isAdmin,
            // Note: 'registrations' here refers to the user's own registrations array.
            // For counts of registrations on events *created by this user*, use the /my-events/registration-counts route.
            registrations: user.registrations, 
        });
    } else {
        res.status(404).json({ message: 'User not found' });
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
            return res.status(400).json({ message: 'No avatar provided' });
        }
        
        let updatedAvatarUrl = newAvatar;

        // Check if the newAvatar is a base64 string and needs uploading
        if (newAvatar.startsWith('data:image')) {
            const imageUrl = await uploadImage(newAvatar);
            if (imageUrl) {
                updatedAvatarUrl = imageUrl;
            } else {
                return res.status(500).json({ message: 'Failed to upload image to Cloudinary' });
            }
        }

        user.avatar = updatedAvatarUrl || 'https://placehold.co/40x40/cccccc/000000?text=A'; // Fallback to placeholder if upload fails or no new avatar
        const updatedUser = await user.save();
        
        // Update authorAvatar in posts created by this user
        await Post.updateMany({ userId: user._id }, { $set: { authorAvatar: updatedUser.avatar } });

        // Update authorAvatar in comments made by this user across all posts
        await Post.updateMany(
            { 'commentData.authorId': user._id }, // Filter posts containing comments by this user
            { $set: { 'commentData.$[elem].authorAvatar': updatedUser.avatar } }, // Set the new avatar for matching elements
            { arrayFilters: [{ 'elem.authorId': user._id }] } // Filter elements within the array
        );
        
        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            avatar: updatedUser.avatar,
            // For security, do not send the full token back, just confirm success.
            // The frontend should manage its token.
            token: req.headers.authorization.split(' ')[1], // Re-sending the existing token for convenience, but not strictly necessary for avatar update.
            isAdmin: updatedUser.isAdmin,
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
}));

// @desc    Get a list of all posts the user has liked
// @route   GET /api/users/liked-posts
// @access  Private
router.get('/liked-posts', protect, asyncHandler(async (req, res) => {
    const likedPosts = await Post.find({ likedBy: req.user._id }).select('_id');
    const likedPostIds = likedPosts.map(post => post._id);
    res.json({ likedPostIds });
}));

// @desc    Get event IDs the current user has registered for
// @route   GET /api/users/my-registrations
// @access  Private
// This route is for the frontend to quickly check if the current user is registered for specific events.
router.get('/my-registrations', protect, asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('registrations');
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    // Extract only the eventId from each registration object
    const registeredEventIds = user.registrations.map(reg => reg.eventId.toString());
    
    res.json({ registeredEventIds });
}));


// @desc    Get registration counts for events created by the logged-in user
// @route   GET /api/users/my-events/registration-counts
// @access  Private
// This route uses aggregation to count registrations only for the logged-in user's events.
router.get('/my-events/registration-counts', protect, asyncHandler(async (req, res) => {
    const registrations = await User.aggregate([
        // Stage 1: Deconstruct the 'registrations' array from all user documents
        { $unwind: '$registrations' },
        // Stage 2: Join with the 'posts' collection to get event details
        {
            $lookup: {
                from: 'posts', // The collection name for your Post model (usually lowercase and plural)
                localField: 'registrations.eventId', // Field from the 'registrations' array
                foreignField: '_id', // Field from the 'posts' collection
                as: 'eventDetails' // Output array field of the joined documents
            }
        },
        // Stage 3: Deconstruct the 'eventDetails' array (each registration now has its event details)
        { $unwind: '$eventDetails' },
        // Stage 4: Filter to only include registrations for events created by the current user
        { $match: { 'eventDetails.userId': req.user._id } },
        // Stage 5: Group by event ID and count the number of registrations for each event
        {
            $group: {
                _id: '$eventDetails._id', // Group by the event's ID
                count: { $sum: 1 } // Count the number of registrations for each event
            }
        }
    ]);
    
    // Format the result into an object where keys are event IDs and values are counts
    const registrationsMap = registrations.reduce((acc, reg) => {
        acc[reg._id.toString()] = reg.count;
        return acc;
    }, {});

    res.json({ registrations: registrationsMap });
}));

// @desc    Register for an event
// @route   POST /api/users/register-event/:id
// @access  Private
router.post('/register-event/:id', protect, asyncHandler(async (req, res) => {
    const event = await Post.findById(req.params.id);
    const user = await User.findById(req.user._id);

    // Basic validation
    if (!event || !user) {
        return res.status(404).json({ message: 'Event or user not found' });
    }

    // Check if the user is already registered for this specific event
    const isRegistered = user.registrations.some(reg => reg.eventId.toString() === event._id.toString());
    if (isRegistered) {
        // Return 400 Bad Request to indicate that the request cannot be fulfilled due to duplicate data
        return res.status(400).json({ message: 'User is already registered for this event' });
    }

    // Prepare registration data
    const registrationData = {
        eventId: event._id,
        eventName: event.title, // Store event name for easier lookup/display
        registeredAt: new Date(),
        // You might want to add more registration details here from req.body
        // e.g., name: req.body.name, email: req.body.email, phone: req.body.phone
        // Ensure these fields are also in your User schema's 'registrations' sub-document if needed.
    };

    // Add the new registration to the user's registrations array
    user.registrations.push(registrationData);
    await user.save(); // Save the updated user document

    // Optionally, you might want to send a notification to the event creator
    // or update a registration count on the event itself (if not already handled by aggregation).

    res.status(201).json({ message: 'Registration successful', registration: registrationData });
}));

// @desc    Admin endpoint to get all reported posts
// @route   GET /api/users/admin/reported-posts
// @access  Private, Admin
router.get('/admin/reported-posts', protect, admin, asyncHandler(async (req, res) => {
    // Find notifications that have a 'reportReason' field, indicating they are reports
    const reportedPosts = await Notification.find({ reportReason: { $exists: true } })
        .populate('reporter', 'name email phone') // Populate details of the user who reported
        .populate('postId', 'title'); // Populate the title of the reported post
    res.json(reportedPosts);
}));

// @desc    Admin endpoint to delete a post and its reports
// @route   DELETE /api/users/admin/delete-post/:id
// @access  Private, Admin
router.delete('/admin/delete-post/:id', protect, admin, asyncHandler(async (req, res) => {
    const postId = req.params.id;
    const post = await Post.findById(postId);

    if (post) {
        await post.deleteOne(); // Delete the post itself
        await Notification.deleteMany({ postId: postId }); // Delete all notifications/reports related to this post
        res.json({ message: 'Post and associated reports removed' });
    } else {
        res.status(404).json({ message: 'Post not found' });
    }
}));

module.exports = router;