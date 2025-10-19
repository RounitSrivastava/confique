const express = require('express');
const asyncHandler = require('express-async-handler');
const { Parser } = require('json2csv');
const User = require('../models/User');
const { Post, Registration } = require('../models/Post'); 
const Notification = require('../models/Notification');
const { protect, admin } = require('../middleware/auth');
const cloudinary = require('cloudinary').v2;

const router = express.Router();

// Helper function to upload base64 images to Cloudinary
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

// --- USER PROFILE & ACTIONS ---

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
router.get('/profile', protect, asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id)
        .select('-password')
        .populate('upvotedPosts', 'title month upvotes')
        .populate('bookmarkedPosts', 'title month upvotes logoUrl');

    if (user) {
        // ✅ Standardized avatar handling - always return string URL
        const avatarUrl = typeof user.avatar === 'object' ? user.avatar?.url : user.avatar;
        
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            avatar: avatarUrl || null,
            isAdmin: user.isAdmin,
            // Showcase-specific fields
            upvotedPosts: user.upvotedPosts || [],
            bookmarkedPosts: user.bookmarkedPosts || [],
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
}));

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
router.put('/profile', protect, asyncHandler(async (req, res) => {
    const { name, bio, website, linkedin, twitter } = req.body;
    
    // Basic validation
    if (name && name.length < 2) {
        return res.status(400).json({ message: 'Name must be at least 2 characters long' });
    }

    if (bio && bio.length > 500) {
        return res.status(400).json({ message: 'Bio must be less than 500 characters' });
    }
    
    const user = await User.findByIdAndUpdate(
        req.user._id,
        { 
            name,
            bio,
            website,
            linkedin,
            twitter
        },
        { new: true }
    ).select('-password');

    res.json(user);
}));

// @desc    Update user avatar
// @route   PUT /api/users/profile/avatar
// @access  Private
router.put('/profile/avatar', protect, asyncHandler(async (req, res) => {
    try {
        const { avatarUrl } = req.body;
        
        if (!avatarUrl) {
            return res.status(400).json({ message: 'No avatar URL provided' });
        }

        console.log('🔄 Updating avatar for user:', req.user._id);

        // Get current user to check existing avatar
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Handle Cloudinary cleanup for old avatar if it exists
        if (user.avatar && typeof user.avatar === 'object' && user.avatar.url && user.avatar.url.includes('cloudinary') && user.avatar.publicId && user.avatar.publicId !== 'default_avatar') {
            try {
                await cloudinary.uploader.destroy(user.avatar.publicId);
                console.log('🗑️ Deleted old Cloudinary avatar:', user.avatar.publicId);
            } catch (cloudinaryErr) {
                console.error('Cloudinary deletion failed for old avatar:', cloudinaryErr);
            }
        }

        // Upload new avatar to Cloudinary if it's a base64 data URL
        let finalAvatarUrl = avatarUrl;
        let publicId = 'custom_avatar_' + Date.now();

        if (avatarUrl.startsWith('data:image')) {
            const imageUrl = await uploadImage(avatarUrl, 'confique_avatars');
            if (imageUrl) {
                finalAvatarUrl = imageUrl;
                // Extract publicId from Cloudinary URL
                const parts = imageUrl.split('/');
                publicId = `confique_avatars/${parts[parts.length - 1].split('.')[0]}`;
            } else {
                return res.status(500).json({ message: 'Failed to upload image to Cloudinary' });
            }
        }

        // ✅ Update user with avatar object (for database storage)
        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            { 
                avatar: {
                    url: finalAvatarUrl,
                    publicId: publicId
                }
            },
            { new: true }
        );

        console.log('✅ Avatar updated successfully');

        // Update avatar in all user's posts (use the URL string)
        await Post.updateMany(
            { userId: req.user._id }, 
            { $set: { authorAvatar: finalAvatarUrl } }
        );

        // Update avatar in all user's comments (use the URL string)
        await Post.updateMany(
            { 'commentData.userId': req.user._id },
            { $set: { 'commentData.$[elem].authorAvatar': finalAvatarUrl } },
            { arrayFilters: [{ 'elem.userId': req.user._id }] }
        );

        // Update avatar in showcase comments
        await Post.updateMany(
            { 'comments.user': req.user._id },
            { $set: { 'comments.$[elem].authorAvatar': finalAvatarUrl } },
            { arrayFilters: [{ 'elem.user': req.user._id }] }
        );

        // ✅ Return avatar as string URL for frontend compatibility
        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            avatar: finalAvatarUrl, // ✅ Return string URL instead of object
            isAdmin: updatedUser.isAdmin,
        });

    } catch (error) {
        console.error('❌ Avatar update error:', error);
        res.status(500).json({ 
            message: 'Failed to update avatar', 
            error: error.message,
            details: 'Check server logs for more information'
        });
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

// ==============================================
// NEW STARTUP SHOWCASE USER ROUTES
// ==============================================

// @desc    Get user's showcase posts
// @route   GET /api/users/showcase-posts
// @access  Private
router.get('/showcase-posts', protect, asyncHandler(async (req, res) => {
    const posts = await Post.find({ 
        userId: req.user._id, 
        type: 'showcase' 
    })
    .sort({ createdAt: -1 })
    .populate('upvoters', 'name avatar')
    .select('title description month upvotes comments commentCount createdAt status');

    res.json(posts);
}));

// @desc    Get user's upvoted showcase posts
// @route   GET /api/users/upvoted-showcase
// @access  Private
router.get('/upvoted-showcase', protect, asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).populate({
        path: 'upvotedPosts',
        match: { type: 'showcase' },
        select: 'title description month upvotes logoUrl bannerUrl createdAt'
    });

    res.json(user.upvotedPosts || []);
}));

// @desc    Get user's bookmarked showcase posts
// @route   GET /api/users/bookmarked-showcase
// @access  Private
router.get('/bookmarked-showcase', protect, asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).populate({
        path: 'bookmarkedPosts',
        match: { type: 'showcase' },
        select: 'title description month upvotes logoUrl bannerUrl createdAt'
    });

    res.json(user.bookmarkedPosts || []);
}));

// @desc    Bookmark a showcase post
// @route   POST /api/users/bookmark/:postId
// @access  Private
router.post('/bookmark/:postId', protect, asyncHandler(async (req, res) => {
    const postId = req.params.postId;
    
    // Validate postId format
    if (!postId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({ message: 'Invalid post ID format' });
    }

    const post = await Post.findById(postId);
    
    if (!post) {
        return res.status(404).json({ message: 'Post not found' });
    }

    if (post.type !== 'showcase') {
        return res.status(400).json({ message: 'Only showcase posts can be bookmarked' });
    }

    const user = await User.findById(req.user._id);
    const isBookmarked = user.bookmarkedPosts.includes(post._id);

    if (isBookmarked) {
        // Remove bookmark
        user.bookmarkedPosts = user.bookmarkedPosts.filter(
            postId => postId.toString() !== post._id.toString()
        );
    } else {
        // Add bookmark
        user.bookmarkedPosts.push(post._id);
    }

    await user.save();
    res.json({ 
        bookmarked: !isBookmarked,
        bookmarkedPosts: user.bookmarkedPosts 
    });
}));

// @desc    Check if user has bookmarked a post
// @route   GET /api/users/check-bookmark/:postId
// @access  Private
router.get('/check-bookmark/:postId', protect, asyncHandler(async (req, res) => {
    const postId = req.params.postId;
    
    // Validate postId format
    if (!postId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({ bookmarked: false, message: 'Invalid post ID' });
    }

    const user = await User.findById(req.user._id);
    const isBookmarked = user.bookmarkedPosts.includes(postId);
    
    res.json({ bookmarked: isBookmarked });
}));

// @desc    Get user's showcase statistics
// @route   GET /api/users/showcase-stats
// @access  Private
router.get('/showcase-stats', protect, asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const [
        totalPosts,
        totalUpvotes,
        totalComments,
        upvotedPosts,
        bookmarkedPosts
    ] = await Promise.all([
        // Total showcase posts created by user
        Post.countDocuments({ userId, type: 'showcase' }),
        
        // Total upvotes received on user's showcase posts
        Post.aggregate([
            { $match: { userId, type: 'showcase' } },
            { $group: { _id: null, total: { $sum: '$upvotes' } } }
        ]),
        
        // Total comments received on user's showcase posts
        Post.aggregate([
            { $match: { userId, type: 'showcase' } },
            { $group: { _id: null, total: { $sum: '$commentCount' } } }
        ]),
        
        // Number of posts user has upvoted
        User.findById(userId).select('upvotedPosts'),
        
        // Number of posts user has bookmarked
        User.findById(userId).select('bookmarkedPosts')
    ]);

    res.json({
        postsCreated: totalPosts,
        totalUpvotesReceived: totalUpvotes[0]?.total || 0,
        totalCommentsReceived: totalComments[0]?.total || 0,
        postsUpvoted: upvotedPosts.upvotedPosts?.length || 0,
        postsBookmarked: bookmarkedPosts.bookmarkedPosts?.length || 0
    });
}));

// --- EVENT REGISTRATIONS ---

// @desc    Get all event IDs a user is registered for
// @route   GET /api/users/my-events-registrations
// @access  Private
router.get('/my-events-registrations', protect, asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const registeredEvents = await Registration.find({ userId: userId }).select('eventId');
    const registeredEventIds = registeredEvents.map(reg => reg.eventId);
    res.json({ registeredEventIds });
}));

// @desc    Get registration counts for events created by the logged-in user
// @route   GET /api/users/my-events/registration-counts
// @access  Private
router.get('/my-events/registration-counts', protect, asyncHandler(async (req, res) => {
    const myEvents = await Post.find({ userId: req.user._id, type: { $in: ['event', 'culturalEvent'] } });
    const registrationCounts = {};
    
    await Promise.all(myEvents.map(async (event) => {
        const count = await Registration.countDocuments({ eventId: event._id });
        registrationCounts[event._id] = count;
    }));

    res.status(200).json({ registrations: registrationCounts });
}));

// @desc    Register for an event
// @route   POST /api/users/register-event/:eventId
// @access  Private
router.post('/register-event/:eventId', protect, asyncHandler(async (req, res) => {
    const { eventId } = req.params;
    const userId = req.user._id;

    // Validate eventId format
    if (!eventId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({ message: 'Invalid event ID format' });
    }

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

    const { 
        name, 
        email, 
        phone, 
        transactionId,
        bookingDates,
        selectedTickets,
        totalPrice,
        ...customFields
    } = req.body;

    // Basic validation
    if (!name || !email) {
        return res.status(400).json({ message: 'Name and email are required' });
    }

    const newRegistrationData = {
        eventId,
        userId,
        name,
        email,
        phone,
        transactionId,
        customFields,
        bookingDates,
        selectedTickets,
        totalPrice
    };
    
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
}));

// @desc    Export registrations for a specific event to a CSV file
// @route   GET /api/users/export-registrations/:eventId
// @access  Private (Event host or Admin)
router.get('/export-registrations/:eventId', protect, asyncHandler(async (req, res) => {
    try {
        const { eventId } = req.params;
        
        // Validate eventId format
        if (!eventId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: 'Invalid event ID format' });
        }

        console.log('🔍 Export request received for event:', eventId);
        console.log('👤 Request from user:', req.user._id, req.user.name);

        const event = await Post.findById(eventId);
        if (!event) {
            console.log('❌ Event not found:', eventId);
            return res.status(404).json({ message: 'Event not found.' });
        }

        console.log('📝 Event found:', event.title, 'by user:', event.userId);
        
        // Check authorization
        if (event.userId.toString() !== req.user._id.toString() && !req.user.isAdmin) {
            console.log('🚫 Unauthorized access attempt');
            return res.status(403).json({ message: 'Not authorized to export this data.' });
        }

        console.log('✅ User authorized, fetching registrations...');
        const registrations = await Registration.find({ eventId }).lean();
        console.log(`📊 Found ${registrations.length} registrations`);

        if (registrations.length === 0) {
            console.log('ℹ️ No registrations found for event');
            return res.status(404).json({ message: 'No registrations found for this event.' });
        }

        const headers = new Set(['Name', 'Email', 'Phone', 'Transaction ID', 'Registered At', 'Booking Dates', 'Total Price', 'Ticket Type', 'Ticket Quantity', 'Ticket Price']);
        const flattenedData = [];
        
        registrations.forEach(reg => {
            const baseData = {
                'Name': reg.name || '',
                'Email': reg.email || '',
                'Phone': reg.phone || '',
                'Transaction ID': reg.transactionId || '',
                'Registered At': reg.createdAt ? reg.createdAt.toISOString() : '',
                'Booking Dates': (reg.bookingDates || []).join(', '),
                'Total Price': reg.totalPrice || '',
            };
            
            if (reg.customFields) {
                for (const key in reg.customFields) {
                    if (Object.prototype.hasOwnProperty.call(reg.customFields, key)) {
                        baseData[key] = reg.customFields[key] || '';
                        headers.add(key);
                    }
                }
            }
            
            if (event.type === 'culturalEvent' && reg.selectedTickets && reg.selectedTickets.length > 0) {
                reg.selectedTickets.forEach(ticket => {
                    flattenedData.push({
                        ...baseData,
                        'Ticket Type': ticket.ticketType || '',
                        'Ticket Quantity': ticket.quantity || '',
                        'Ticket Price': ticket.ticketPrice || '',
                    });
                });
            } else {
                flattenedData.push({
                    ...baseData,
                    'Ticket Type': '',
                    'Ticket Quantity': '',
                    'Ticket Price': '',
                });
            }
        });

        const finalHeaders = Array.from(headers);
        const json2csvParser = new Parser({ fields: finalHeaders });
        const csv = json2csvParser.parse(flattenedData);
        
        console.log('✅ CSV generated successfully');
        res.header('Content-Type', 'text/csv');
        const safeTitle = event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 50);
        res.attachment(`registrations_${safeTitle}_${eventId}.csv`);
        res.send(csv);

    } catch (error) {
        console.error('❌ CSV export error:', error);
        res.status(500).json({ 
            message: 'Error generating CSV file.',
            error: error.message 
        });
    }
}));

// --- ADMIN ROUTES ---

// @desc    Admin endpoint to get all reported posts
// @route   GET /api/users/admin/reported-posts
// @access  Private, Admin
router.get('/admin/reported-posts', protect, admin, asyncHandler(async (req, res) => {
    const reportedPosts = await Notification.find({ type: 'report' })
        .populate('reporter', 'name email')
        .populate('postId', 'title content');
    res.json(reportedPosts);
}));

// @desc    Admin endpoint to get all registrations for a specific event
// @route   GET /api/users/admin/registrations/:eventId
// @access  Private, Admin
router.get('/admin/registrations/:eventId', protect, asyncHandler(async (req, res) => {
    const eventId = req.params.eventId;
    
    // Validate eventId format
    if (!eventId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({ message: 'Invalid event ID format' });
    }

    const event = await Post.findById(eventId);
    
    if (!event) {
        return res.status(404).json({ message: 'Event not found' });
    }

    if (event.userId.toString() !== req.user._id.toString() && !req.user.isAdmin) {
        return res.status(403).json({ message: 'You are not authorized to view this data.' });
    }
    
    const registrations = await Registration.find({ eventId: event._id });
    res.json(registrations);
}));

// @desc    Admin endpoint to delete a post and its reports
// @route   DELETE /api/users/admin/delete-post/:id
// @access  Private, Admin
router.delete('/admin/delete-post/:id', protect, admin, asyncHandler(async (req, res) => {
    const postId = req.params.id;
    
    // Validate postId format
    if (!postId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({ message: 'Invalid post ID format' });
    }

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

// Test route for debugging
router.get('/test-avatar-fix', protect, asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    res.json({
        currentAvatar: user.avatar,
        avatarType: typeof user.avatar,
        isObject: user.avatar && typeof user.avatar === 'object',
        hasUrl: user.avatar && user.avatar.url,
        // Test both formats
        stringUrl: user.avatar?.url || user.avatar,
        rawAvatar: user.avatar
    });
}));

// Debug route to test avatar update with simple data
router.put('/test-simple-avatar', protect, asyncHandler(async (req, res) => {
    try {
        const { avatarUrl } = req.body;
        
        if (!avatarUrl) {
            return res.status(400).json({ message: 'No avatar URL provided' });
        }

        console.log('🧪 Testing simple avatar update with:', avatarUrl);

        // Simple update without Cloudinary processing
        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            { 
                avatar: {
                    url: avatarUrl,
                    publicId: 'test_avatar'
                }
            },
            { new: true }
        );

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            avatar: avatarUrl, // Return as string
            isAdmin: updatedUser.isAdmin,
        });

    } catch (error) {
        console.error('❌ Test avatar update error:', error);
        res.status(500).json({ 
            message: 'Test failed', 
            error: error.message 
        });
    }
}));

module.exports = router;