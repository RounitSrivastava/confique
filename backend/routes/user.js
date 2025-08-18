// routes/user.js

const express = require('express');
const asyncHandler = require('express-async-handler');
const User = require('../models/User'); // Assuming your User model path
const Post = require('../models/Post'); // Assuming your Post model path
const Notification = require('../models/Notification'); // Assuming your Notification model path
const { protect, admin } = require('../middleware/auth'); // Assuming your auth middleware
const cloudinary = require('cloudinary').v2; // Assuming Cloudinary is configured in your server.js

const router = express.Router();

// Helper function to upload base64 images to Cloudinary
const uploadImage = async (image) => {
    if (!image) return null;
    try {
        const result = await cloudinary.uploader.upload(image, {
            folder: 'confique_avatars', // Using a specific folder for avatar images
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
    // Find the user by ID and exclude the password field
    const user = await User.findById(req.user._id).select('-password');

    if (user) {
        // Return user profile data
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            isAdmin: user.isAdmin,
        });
    } else {
        // If user not found, set 404 status and throw an error
        res.status(404);
        throw new Error('User not found');
    }
}));

// @desc    Update user avatar
// @route   PUT /api/users/profile/avatar
// @access  Private
router.put('/profile/avatar', protect, asyncHandler(async (req, res) => {
    // Find the user by ID
    const user = await User.findById(req.user._id);

    if (user) {
        const newAvatar = req.body.avatar;

        // Validate if a new avatar is provided
        if (!newAvatar) {
            res.status(400);
            throw new Error('No avatar provided');
        }
        
        let updatedAvatarUrl = newAvatar;

        // Check if the new avatar is a base64 string (meaning it's a new upload)
        if (newAvatar.startsWith('data:image')) {
            // If an old avatar exists and is from Cloudinary, delete it
            if (user.avatar && user.avatar.includes('cloudinary')) {
                const parts = user.avatar.split('/');
                const publicId = `confique_avatars/${parts[parts.length - 1].split('.')[0]}`;
                try {
                    await cloudinary.uploader.destroy(publicId);
                } catch (cloudinaryErr) {
                    // Log Cloudinary deletion errors but don't stop the process
                    console.error('Cloudinary deletion failed for old avatar:', cloudinaryErr);
                }
            }

            // Upload the new base64 avatar image to Cloudinary
            const imageUrl = await uploadImage(newAvatar);
            if (imageUrl) {
                updatedAvatarUrl = imageUrl;
            } else {
                // If Cloudinary upload fails, send a 500 error
                res.status(500);
                throw new Error('Failed to upload image to Cloudinary');
            }
        }

        // Update the user's avatar
        user.avatar = updatedAvatarUrl;
        const updatedUser = await user.save();
        
        // Update the authorAvatar in all posts created by this user
        await Post.updateMany({ userId: user._id }, { $set: { authorAvatar: updatedUser.avatar } });
        
        // Update the authorAvatar in all comments made by this user
        // Using arrayFilters to update elements within the commentData array
        await Post.updateMany(
            { 'commentData.userId': user._id },
            { $set: { 'commentData.$[elem].authorAvatar': updatedUser.avatar } },
            { arrayFilters: [{ 'elem.userId': user._id }] }
        );
        
        // Return the updated user profile
        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            avatar: updatedUser.avatar,
            isAdmin: updatedUser.isAdmin,
        });
    } else {
        // If user not found, set 404 status and throw an error
        res.status(404);
        throw new Error('User not found');
    }
}));

// @desc    Get a list of all posts the user has liked
// @route   GET /api/users/liked-posts
// @access  Private
router.get('/liked-posts', protect, asyncHandler(async (req, res) => {
    // Find all posts where the current user's ID is present in the 'likedBy' array
    const likedPosts = await Post.find({ likedBy: req.user._id });

    // Extract only the '_id' of each liked post and return them
    const likedPostIds = likedPosts.map(post => post._id);

    res.json({ likedPostIds });
}));

// @desc    Get event IDs the current user has registered for
// @route   GET /api/users/my-events-registrations
// @access  Private
router.get('/my-events-registrations', protect, asyncHandler(async (req, res) => {
    // Find the user by ID and select only their 'registrations' field
    const user = await User.findById(req.user._id).select('registrations');
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    // Map the registrations to get an array of event IDs as strings
    const registeredEventIds = user.registrations.map(reg => reg.eventId.toString());
    
    res.json({ registeredEventIds });
}));

// @desc    Get registration counts for events created by the logged-in user
// @route   GET /api/users/my-events/registration-counts
// @access  Private
router.get('/my-events/registration-counts', protect, asyncHandler(async (req, res) => {
    try {
        // Aggregate pipeline to match events created by the user and count registered users
        const registrations = await Post.aggregate([
            { $match: { userId: req.user._id, type: 'event' } }, // Match posts by current user and type 'event'
            {
                $addFields: {
                    // Ensure 'registeredUsers' is an array, even if it's missing or not an array
                    registeredUsersArray: {
                        $cond: {
                            if: { $isArray: '$registeredUsers' },
                            then: '$registeredUsers',
                            else: []
                        }
                    }
                }
            },
            {
                $project: {
                    _id: '$_id', // Keep the event ID
                    count: { $size: '$registeredUsersArray' } // Count the size of the registeredUsersArray
                }
            }
        ]);
        
        // Convert the array of { _id, count } objects into a map for easier frontend consumption
        const registrationsMap = registrations.reduce((acc, reg) => {
            acc[reg._id.toString()] = reg.count;
            return acc;
        }, {});

        res.json({ registrations: registrationsMap });

    } catch (error) {
        console.error('Error in registration-counts route:', error);
        // Return a 500 status with a generic message for security
        res.status(500).json({ message: 'Failed to fetch registration counts due to a server error. Check server logs.' });
    }
}));

// @desc    Register for an event
// @route   POST /api/users/register-event/:id
// @access  Private
router.post('/register-event/:id', protect, asyncHandler(async (req, res) => {
    const event = await Post.findById(req.params.id);
    const user = await User.findById(req.user._id);

    // Check if event or user exists
    if (!event || !user) {
        res.status(404);
        throw new Error('Event or user not found');
    }

    // Check if user is already registered for this event
    const isRegistered = user.registrations.some(reg => reg.eventId.toString() === event._id.toString());
    if (isRegistered) {
        res.status(400);
        throw new Error('User is already registered for this event');
    }

    // Add event to user's registrations
    user.registrations.push({
        eventId: event._id,
        eventName: event.title,
        registeredAt: new Date(),
    });
    await user.save();

    // Add user to event's registeredUsers
    event.registeredUsers.push(user._id);
    await event.save();
    
    // Notify the event creator about the new registration
    const eventCreator = await User.findById(event.userId);
    if(eventCreator) {
        const newNotification = new Notification({
            recipient: eventCreator._id,
            message: `${user.name} has registered for your event "${event.title}"!`,
            postId: event._id, // Link notification to the event post
            type: 'registration', // Custom type for registration notifications
            timestamp: new Date(),
        });
        await newNotification.save();
    }

    res.status(201).json({ message: 'Registration successful', registeredEventId: event._id });
}));


// @desc    Admin endpoint to get all reported posts
// @route   GET /api/users/admin/reported-posts
// @access  Private, Admin
// The 'admin' middleware ensures only users with isAdmin: true can access this route
router.get('/admin/reported-posts', protect, admin, asyncHandler(async (req, res) => {
    // Find all notifications that are of type 'report'
    // Populate 'reporter' and 'postId' fields to get related user and post details
    const reportedPosts = await Notification.find({ type: 'report' })
        .populate('reporter', 'name email') // Get name and email of the reporter
        .populate('postId', 'title content'); // Get title and content of the reported post
    res.json(reportedPosts);
}));

// @desc    Admin endpoint to delete a post and its reports
// @route   DELETE /api/users/admin/delete-post/:id
// @access  Private, Admin
// The 'admin' middleware ensures only users with isAdmin: true can access this route
router.delete('/admin/delete-post/:id', protect, admin, asyncHandler(async (req, res) => {
    const postId = req.params.id;
    const post = await Post.findById(postId);

    if (post) {
        // Delete the post itself
        await post.deleteOne();
        // Delete all associated notifications (reports) for this post
        await Notification.deleteMany({ postId: postId });
        res.json({ message: 'Post and associated reports removed' });
    } else {
        res.status(404).json({ message: 'Post not found' });
    }
}));


module.exports = router;
