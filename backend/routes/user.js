// routes/user.js

const express = require('express');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const { protect, admin } = require('../middleware/auth');
const cloudinary = require('cloudinary').v2;

const router = express.Router();

// Helper function to upload base64 images to Cloudinary
const uploadImage = async (image) => {
    if (!image) return null;
    try {
        const result = await cloudinary.uploader.upload(image, {
            folder: 'confique_avatars',
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

            const imageUrl = await uploadImage(newAvatar);
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
    const user = await User.findById(req.user._id).select('likedPosts');
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }
    res.json({ likedPostIds: user.likedPosts });
}));

// @desc    Get event IDs the current user has registered for
// @route   GET /api/users/my-events-registrations
// @access  Private
router.get('/my-events-registrations', protect, asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('registrations');
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    const registeredEventIds = user.registrations.map(reg => reg.eventId.toString());
    
    res.json({ registeredEventIds });
}));

// @desc    Get registration counts for events created by the logged-in user
// @route   GET /api/users/my-events/registration-counts
// @access  Private
router.get('/my-events/registration-counts', protect, asyncHandler(async (req, res) => {
    try {
        const registrations = await Post.aggregate([
            { $match: { userId: req.user._id, type: 'event' } },
            {
                $addFields: {
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
                    _id: '$_id',
                    count: { $size: '$registeredUsersArray' }
                }
            }
        ]);
        
        const registrationsMap = registrations.reduce((acc, reg) => {
            acc[reg._id.toString()] = reg.count;
            return acc;
        }, {});

        res.json({ registrations: registrationsMap });

    } catch (error) {
        console.error('Error in registration-counts route:', error);
        res.status(500).json({ message: 'Failed to fetch registration counts due to a server error. Check server logs.' });
    }
}));

// @desc    Register for an event
// @route   POST /api/users/register-event/:id
// @access  Private
router.post('/register-event/:id', protect, asyncHandler(async (req, res) => {
    const event = await Post.findById(req.params.id);
    const user = await User.findById(req.user._id);

    if (!event || !user) {
        res.status(404);
        throw new Error('Event or user not found');
    }

    const isRegistered = user.registrations.some(reg => reg.eventId.toString() === event._id.toString());
    if (isRegistered) {
        res.status(400);
        throw new Error('User is already registered for this event');
    }

    user.registrations.push({
        eventId: event._id,
        eventName: event.title,
        registeredAt: new Date(),
    });
    await user.save();

    event.registeredUsers.push(user._id);
    await event.save();
    
    const eventCreator = await User.findById(event.userId);
    if(eventCreator) {
        const newNotification = new Notification({
            recipient: eventCreator._id,
            message: `${user.name} has registered for your event "${event.title}"!`,
            postId: event._id,
            type: 'registration',
        });
        await newNotification.save();
    }

    res.status(201).json({ message: 'Registration successful', registeredEventId: event._id });
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

// @desc    Admin endpoint to delete a post and its reports
// @route   DELETE /api/users/admin/delete-post/:id
// @access  Private, Admin
router.delete('/admin/delete-post/:id', protect, admin, asyncHandler(async (req, res) => {
    const postId = req.params.id;
    const post = await Post.findById(postId);

    if (post) {
        await post.deleteOne();
        await Notification.deleteMany({ postId: postId });
        res.json({ message: 'Post and associated reports removed' });
    } else {
        res.status(404).json({ message: 'Post not found' });
    }
}));


module.exports = router;