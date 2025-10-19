const express = require('express');
const asyncHandler = require('express-async-handler');
const { Post, Registration } = require('../models/Post');
const Notification = require('../models/Notification');
const { protect, admin } = require('../middleware/auth');
const cloudinary = require('cloudinary').v2;
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

const uploadImage = async (image) => {
    if (!image) return null;
    try {
        const result = await cloudinary.uploader.upload(image, {
            folder: 'confique_posts',
        });
        return result.secure_url;
    } catch (error) {
        console.error('Cloudinary upload failed:', error);
        return null;
    }
};

// Helper function to extract Cloudinary public ID
const extractPublicId = (url) => {
    if (!url || !url.includes('cloudinary')) return null;
    
    try {
        const parts = url.split('/');
        const uploadIndex = parts.findIndex(part => part === 'upload');
        if (uploadIndex !== -1 && parts.length > uploadIndex + 1) {
            const pathAfterUpload = parts.slice(uploadIndex + 1).join('/');
            return pathAfterUpload.replace(/^v\d+\//, '').split('.')[0];
        }
    } catch (error) {
        console.error('Error extracting public ID from URL:', url, error);
    }
    return null;
};

// ==============================================
// EXISTING ROUTES (KEEP ALL ORIGINAL FUNCTIONALITY)
// ==============================================

// @desc    Get all posts
// @route   GET /api/posts
// @access  Public (for approved posts), Private (for all posts as admin)
router.get('/', asyncHandler(async (req, res) => {
    let posts;
    let isAdmin = false;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        const token = req.headers.authorization.split(' ')[1];
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select('isAdmin');
            if (user && user.isAdmin) {
                isAdmin = true;
            }
        } catch (error) {
            console.log("Invalid or expired token for GET /api/posts, serving public content.");
        }
    }

    if (isAdmin) {
        posts = await Post.find().sort({ timestamp: -1 });
    } else {
        posts = await Post.find({ status: 'approved' }).sort({ timestamp: -1 });
    }
    res.json(posts);
}));

// @desc    Get all pending events (for admin approval)
// @route   GET /api/posts/pending-events
// @access  Private (Admin only)
router.get('/pending-events', protect, admin, asyncHandler(async (req, res) => {
    const pendingEvents = await Post.find({ type: { $in: ['event', 'culturalEvent'] }, status: 'pending' }).sort({ timestamp: 1 });
    res.json(pendingEvents);
}));

// @desc    Get all registrations for a specific event
// @route   GET /api/posts/:id/registrations
// @access  Private (Event creator or Admin only)
router.get('/:id/registrations', protect, asyncHandler(async (req, res) => {
    const eventId = req.params.id;

    const event = await Post.findById(eventId).select('userId type');

    if (!event) {
        res.status(404);
        throw new Error('Event not found');
    }

    if (!['event', 'culturalEvent'].includes(event.type)) {
        res.status(400);
        throw new Error('This is not an event.');
    }

    if (event.userId.toString() !== req.user._id.toString() && !req.user.isAdmin) {
        res.status(403);
        throw new Error('Not authorized to view registrations for this event');
    }

    const registrations = await Registration.find({ eventId: event._id });
    res.json(registrations);
}));

// @desc    Get a single post by ID
// @route   GET /api/posts/:id
// @access  Public
router.get('/:id', asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id);
    if (post) {
        res.json(post);
    } else {
        res.status(404).json({ message: 'Post not found' });
    }
}));

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
router.post('/', protect, asyncHandler(async (req, res) => {
    const { _id: userId, name: authorNameFromUser, avatar: avatarFromUser } = req.user;
    
    // ✅ FIX: Handle avatar object/string properly
    const authorAvatarFinal = avatarFromUser?.url || avatarFromUser || 'https://placehold.co/40x40/cccccc/000000?text=A';

    const {
        type,
        images,
        paymentQRCode,
        culturalPaymentQRCode,
        paymentMethod,
        ticketOptions,
        culturalPaymentMethod,
        availableDates,
        ...restOfPostData
    } = req.body;

    // ==============================================
    // STARTUP SHOWCASE: Check submission deadline for showcase posts
    // ==============================================
    if (type === 'showcase') {
        const SUBMISSION_DEADLINE = new Date('2025-10-31T23:59:59').getTime();
        const now = new Date().getTime();
        if (now > SUBMISSION_DEADLINE) {
            return res.status(400).json({ 
                message: 'Submissions are closed for Startup Showcase. The deadline was October 31, 2025.' 
            });
        }
    }

    let imageUrls = [];
    if (images && Array.isArray(images) && images.length > 0) {
        imageUrls = await Promise.all(images.map(uploadImage));
    } else if (images && typeof images === 'string') {
        imageUrls = [await uploadImage(images)];
    }

    let qrCodeUrl = null;
    if (type === 'event' && paymentQRCode) {
        qrCodeUrl = await uploadImage(paymentQRCode);
    } else if (type === 'culturalEvent' && culturalPaymentQRCode) {
        qrCodeUrl = await uploadImage(culturalPaymentQRCode);
    }

    const newPostData = {
        ...restOfPostData,
        images: imageUrls.filter(url => url !== null),
        type,
        author: authorNameFromUser,
        authorAvatar: authorAvatarFinal,
        userId: userId,
        status: (type === 'event' || type === 'culturalEvent') ? 'pending' : 'approved',
        likes: 0,
        likedBy: [],
        commentData: [],
        timestamp: new Date(),
    };

    // ==============================================
    // STARTUP SHOWCASE: Set default values for showcase posts
    // ==============================================
    if (type === 'showcase') {
        newPostData.upvotes = 0;
        newPostData.upvoters = [];
        newPostData.comments = 0;
        newPostData.commentCount = 0;
        newPostData.month = restOfPostData.month || new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
        newPostData.launchedDate = restOfPostData.launchedDate || new Date().toLocaleDateString('en-IN');
        newPostData.status = 'approved'; // Showcase posts are auto-approved
    }

    if (type === 'event') {
        if (qrCodeUrl) newPostData.paymentQRCode = qrCodeUrl;
        newPostData.paymentMethod = ['link', 'qr'].includes(paymentMethod) ? paymentMethod : undefined;
        newPostData.ticketOptions = undefined;
        newPostData.culturalPaymentMethod = undefined;
        newPostData.culturalPaymentLink = undefined;
        newPostData.culturalPaymentQRCode = undefined;
        newPostData.availableDates = undefined;
    } else if (type === 'culturalEvent') {
        if (qrCodeUrl) newPostData.culturalPaymentQRCode = qrCodeUrl;
        newPostData.ticketOptions = ticketOptions;
        newPostData.culturalPaymentMethod = culturalPaymentMethod;
        newPostData.availableDates = availableDates;
        newPostData.price = undefined;
        newPostData.paymentMethod = undefined;
        newPostData.paymentLink = undefined;
        newPostData.paymentQRCode = undefined;
    } else if (type === 'showcase') {
        // Clean up showcase posts - remove event-specific fields
        newPostData.location = undefined;
        newPostData.eventStartDate = undefined;
        newPostData.eventEndDate = undefined;
        newPostData.price = undefined;
        newPostData.language = undefined;
        newPostData.duration = undefined;
        newPostData.registrationLink = undefined;
        newPostData.registrationOpen = undefined;
        newPostData.enableRegistrationForm = undefined;
        newPostData.registrationFields = undefined;
        newPostData.paymentMethod = undefined;
        newPostData.paymentLink = undefined;
        newPostData.paymentQRCode = undefined;
        newPostData.source = undefined;
        newPostData.ticketOptions = undefined;
        newPostData.culturalPaymentMethod = undefined;
        newPostData.culturalPaymentLink = undefined;
        newPostData.culturalPaymentQRCode = undefined;
        newPostData.availableDates = undefined;
    } else {
        // Regular posts cleanup
        newPostData.location = undefined;
        newPostData.eventStartDate = undefined;
        newPostData.eventEndDate = undefined;
        newPostData.price = undefined;
        newPostData.language = undefined;
        newPostData.duration = undefined;
        newPostData.registrationLink = undefined;
        newPostData.registrationOpen = undefined;
        newPostData.enableRegistrationForm = undefined;
        newPostData.registrationFields = undefined;
        newPostData.paymentMethod = undefined;
        newPostData.paymentLink = undefined;
        newPostData.paymentQRCode = undefined;
        newPostData.source = undefined;
        newPostData.ticketOptions = undefined;
        newPostData.culturalPaymentMethod = undefined;
        newPostData.culturalPaymentLink = undefined;
        newPostData.culturalPaymentQRCode = undefined;
        newPostData.availableDates = undefined;
    }

    try {
        const post = new Post(newPostData);
        const createdPost = await post.save();
        res.status(201).json(createdPost);
    } catch (error) {
        console.error('❌ Post creation error details:', {
            error: error.message,
            stack: error.stack,
            postData: {
                type: newPostData.type,
                title: newPostData.title,
                imagesCount: newPostData.images?.length || 0
            }
        });
        
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            console.error('Mongoose Validation Error:', messages.join(', '));
            return res.status(400).json({ message: `Validation Failed: ${messages.join(', ')}` });
        }
        
        res.status(500).json({ 
            message: 'Internal server error during post creation',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
}));

// @desc    Update a post
// @route   PUT /api/posts/:id
// @access  Private (Author or Admin only)
router.put('/:id', protect, asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id);
    if (!post) {
        return res.status(404).json({ message: 'Post not found' });
    }

    if (post.userId.toString() !== req.user._id.toString() && !req.user.isAdmin) {
        return res.status(403).json({ message: 'You are not authorized to update this post' });
    }

    const {
        type,
        title,
        content,
        images,
        status,
        paymentMethod,
        ticketOptions,
        culturalPaymentMethod,
        availableDates,
        ...rest
    } = req.body;

    if (images !== undefined) {
        const oldImagePublicIds = post.images
            .map(url => extractPublicId(url))
            .filter(id => id);

        if (oldImagePublicIds.length > 0) {
            try { 
                await cloudinary.api.delete_resources(oldImagePublicIds); 
            } catch (cloudinaryErr) { 
                console.error('Cloudinary deletion failed for old images:', cloudinaryErr); 
            }
        }

        const newImageArray = Array.isArray(images) ? images : (images ? [images] : []);
        const newImageUrls = await Promise.all(newImageArray.map(uploadImage));
        post.images = newImageUrls.filter(url => url !== null);
    }

    let newQrCodeUrl = undefined;
    let oldQrCodeUrl = post.type === 'event' ? post.paymentQRCode : post.culturalPaymentQRCode;
    let newQrCodeData = post.type === 'event' ? rest.paymentQRCode : rest.culturalPaymentQRCode;

    if (newQrCodeData !== undefined && newQrCodeData !== oldQrCodeUrl) {
        if (oldQrCodeUrl) {
            const publicId = extractPublicId(oldQrCodeUrl);
            if (publicId) {
                try { 
                    await cloudinary.uploader.destroy(publicId); 
                } catch (cloudinaryErr) { 
                    console.error('Cloudinary deletion failed for old QR code:', cloudinaryErr); 
                }
            }
        }
        newQrCodeUrl = newQrCodeData ? await uploadImage(newQrCodeData) : (newQrCodeData === '' ? null : undefined);
    }

    post.set({
        type: type !== undefined ? type : post.type,
        title: title !== undefined ? title : post.title,
        content: content !== undefined ? content : post.content,
        paymentMethod: ['link', 'qr'].includes(paymentMethod) ? paymentMethod : undefined,
        ticketOptions: post.type === 'culturalEvent' ? ticketOptions : undefined,
        culturalPaymentMethod: post.type === 'culturalEvent' ? culturalPaymentMethod : undefined,
        availableDates: post.type === 'culturalEvent' ? availableDates : undefined,
        ...rest,
    });

    if (req.user.isAdmin && status !== undefined) {
        post.status = status;
    }

    if (post.type === 'event' && newQrCodeUrl !== undefined) {
        post.paymentQRCode = newQrCodeUrl;
    } else if (post.type === 'culturalEvent' && newQrCodeUrl !== undefined) {
        post.culturalPaymentQRCode = newQrCodeUrl;
    }

    if (post.type === 'event') {
        post.culturalPaymentMethod = undefined;
        post.culturalPaymentLink = undefined;
        post.culturalPaymentQRCode = undefined;
        post.availableDates = undefined;
    } else if (post.type === 'culturalEvent') {
        post.price = undefined;
        post.paymentMethod = undefined;
        post.paymentLink = undefined;
        post.paymentQRCode = undefined;
    } else if (post.type === 'showcase') {
        // Clean up showcase posts
        post.location = undefined;
        post.eventStartDate = undefined;
        post.eventEndDate = undefined;
        post.price = undefined;
        post.language = undefined;
        post.duration = undefined;
        post.registrationLink = undefined;
        post.registrationOpen = undefined;
        post.enableRegistrationForm = undefined;
        post.registrationFields = undefined;
        post.paymentMethod = undefined;
        post.paymentLink = undefined;
        post.paymentQRCode = undefined;
        post.source = undefined;
        post.ticketOptions = undefined;
        post.culturalPaymentMethod = undefined;
        post.culturalPaymentLink = undefined;
        post.culturalPaymentQRCode = undefined;
        post.availableDates = undefined;
    } else {
        // Regular posts cleanup
        post.location = undefined;
        post.eventStartDate = undefined;
        post.eventEndDate = undefined;
        post.price = undefined;
        post.language = undefined;
        post.duration = undefined;
        post.registrationLink = undefined;
        post.registrationOpen = undefined;
        post.enableRegistrationForm = undefined;
        post.registrationFields = undefined;
        post.paymentMethod = undefined;
        post.paymentLink = undefined;
        post.paymentQRCode = undefined;
        post.source = undefined;
        post.ticketOptions = undefined;
        post.culturalPaymentMethod = undefined;
        post.culturalPaymentLink = undefined;
        post.culturalPaymentQRCode = undefined;
        post.availableDates = undefined;
    }

    try {
        const updatedPost = await post.save();
        res.json(updatedPost);
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            console.error('Mongoose Validation Error:', messages.join(', '));
            return res.status(400).json({ message: `Validation Failed during update: ${messages.join(', ')}` });
        }
        throw error;
    }
}));

// @desc    Approve a pending event
// @route   PUT /api/posts/approve-event/:id
// @access  Private (Admin only)
router.put('/approve-event/:id', protect, admin, asyncHandler(async (req, res) => {
    const event = await Post.findById(req.params.id);

    if (event) {
        if (!['event', 'culturalEvent'].includes(event.type)) {
            return res.status(400).json({ message: 'Only events and cultural events can be approved through this route' });
        }
        event.status = 'approved';
        const updatedEvent = await event.save();
        res.json(updatedEvent);
    } else {
        res.status(404).json({ message: 'Event not found' });
    }
}));

// @desc    Reject and delete a pending event
// @route   DELETE /api/posts/reject-event/:id
// @access  Private (Admin only)
router.delete('/reject-event/:id', protect, admin, asyncHandler(async (req, res) => {
    const event = await Post.findById(req.params.id);

    if (event) {
        if (!['event', 'culturalEvent'].includes(event.type)) {
            return res.status(400).json({ message: 'Only events and cultural events can be rejected through this route' });
        }
        const publicIdsToDelete = [];
        
        if (event.images && event.images.length > 0) {
            event.images.forEach(url => {
                const publicId = extractPublicId(url);
                if (publicId) publicIdsToDelete.push(publicId);
            });
        }
        
        const qrCodeUrl = event.type === 'event' ? event.paymentQRCode : event.culturalPaymentQRCode;
        if (qrCodeUrl) {
            const publicId = extractPublicId(qrCodeUrl);
            if (publicId) publicIdsToDelete.push(publicId);
        }

        if (publicIdsToDelete.length > 0) {
            try {
                await cloudinary.api.delete_resources(publicIdsToDelete);
            } catch (cloudinaryErr) {
                console.error('Cloudinary deletion failed for some resources:', cloudinaryErr);
            }
        }
        
        await event.deleteOne();
        await Registration.deleteMany({ eventId: event._id });
        res.json({ message: 'Event rejected and removed' });
    } else {
        res.status(404).json({ message: 'Event not found' });
    }
}));

// @desc    Delete a post
// @route   DELETE /api/posts/:id
// @access  Private (Author or Admin only)
router.delete('/:id', protect, asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id);
    if (post) {
        if (post.userId.toString() !== req.user._id.toString() && !req.user.isAdmin) {
            return res.status(403).json({ message: 'You are not authorized to delete this post' });
        }
        
        const publicIdsToDelete = [];
        if (post.images && post.images.length > 0) {
            post.images.forEach(url => {
                const publicId = extractPublicId(url);
                if (publicId) publicIdsToDelete.push(publicId);
            });
        }
        
        const qrCodeUrl = post.type === 'event' ? post.paymentQRCode : post.culturalPaymentQRCode;
        if (qrCodeUrl) {
            const publicId = extractPublicId(qrCodeUrl);
            if (publicId) publicIdsToDelete.push(publicId);
        }
        
        if (publicIdsToDelete.length > 0) {
            try {
                await cloudinary.api.delete_resources(publicIdsToDelete);
            } catch (cloudinaryErr) {
                console.error('Cloudinary deletion failed for some resources:', cloudinaryErr);
            }
        }
        
        await post.deleteOne();
        if (post.type === 'event' || post.type === 'culturalEvent') {
            await Registration.deleteMany({ eventId: post._id });
        }
        res.json({ message: 'Post removed' });
    } else {
        res.status(404).json({ message: 'Post not found' });
    }
}));

// @desc    Add a comment to a post
// @route   POST /api/posts/:id/comments
// @access  Private
router.post('/:id/comments', protect, asyncHandler(async (req, res) => {
    const { text } = req.body;
    const post = await Post.findById(req.params.id);
    if (post) {
        if (!text || text.trim() === '') {
            return res.status(400).json({ message: 'Comment text cannot be empty' });
        }
        
        // ✅ FIX: Handle avatar object/string properly
        const userAvatar = req.user.avatar?.url || req.user.avatar || 'https://placehold.co/40x40/cccccc/000000?text=A';
        
        const newComment = {
            author: req.user.name,
            authorAvatar: userAvatar,
            text,
            timestamp: new Date(),
            userId: req.user._id,
        };
        post.commentData.push(newComment);
        post.comments = post.commentData.length;
        await post.save();
        res.status(201).json(post.commentData);
    } else {
        res.status(404).json({ message: 'Post not found' });
    }
}));

// @desc    Like a post
// @route   PUT /api/posts/:id/like
// @access  Private
router.put('/:id/like', protect, asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id);
    if (post) {
        if (post.likedBy.includes(req.user._id)) {
            return res.status(400).json({ message: 'You have already liked this post' });
        }
        post.likes += 1;
        post.likedBy.push(req.user._id);
        await post.save();
        res.json({ likes: post.likes, likedBy: post.likedBy });
    } else {
        res.status(404).json({ message: 'Post not found' });
    }
}));

// @desc    Unlike a post
// @route   PUT /api/posts/:id/unlike
// @access  Private
router.put('/:id/unlike', protect, asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id);
    if (post) {
        if (!post.likedBy.includes(req.user._id)) {
            return res.status(400).json({ message: 'You have not liked this post' });
        }
        if (post.likes > 0) {
            post.likes -= 1;
        }
        post.likedBy = post.likedBy.filter(userId => userId.toString() !== req.user._id.toString());
        await post.save();
        res.json({ likes: post.likes, likedBy: post.likedBy });
    } else {
        res.status(404).json({ message: 'Post not found' });
    }
}));

// @desc    Report a post
// @route   POST /api/posts/:id/report
// @access  Private
router.post('/:id/report', protect, asyncHandler(async (req, res) => {
    const { reason } = req.body;
    const post = await Post.findById(req.params.id);
    if (post) {
        if (!reason || reason.trim() === '') {
            return res.status(400).json({ message: 'Report reason cannot be empty' });
        }
        const notification = new Notification({
            message: `Post "${post.title}" has been reported by ${req.user.name} for: ${reason}`,
            reporter: req.user._id,
            postId: post._id,
            reportReason: reason,
            type: 'report',
            timestamp: new Date(),
        });
        await notification.save();
        res.status(201).json({ message: 'Post reported successfully' });
    } else {
        res.status(404).json({ message: 'Post not found' });
    }
}));

// ==============================================
// NEW STARTUP SHOWCASE ROUTES (ADDITIONAL FUNCTIONALITY)
// ==============================================

// @desc    Get posts by month (for showcase)
// @route   GET /api/posts/month/:month
// @access  Public
router.get('/month/:month', asyncHandler(async (req, res) => {
    const { month } = req.params;
    const { search, page = 1, limit = 10 } = req.query;

    let query = { 
        type: 'showcase', 
        month: month,
        status: 'approved' 
    };

    // Add search functionality for showcase
    if (search) {
        query.$or = [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { fullDescription: { $regex: search, $options: 'i' } }
        ];
    }

    const posts = await Post.find(query)
        .populate('creator', 'name avatar')
        .populate('upvoters', 'name avatar')
        .sort({ upvotes: -1, createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

    const total = await Post.countDocuments(query);

    res.json({
        posts,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
    });
}));

// @desc    Upvote a showcase post
// @route   PUT /api/posts/:id/upvote
// @access  Private
router.put('/:id/upvote', protect, asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
        return res.status(404).json({ message: 'Post not found' });
    }

    if (post.type !== 'showcase') {
        return res.status(400).json({ message: 'Only showcase posts can be upvoted' });
    }

    const hasUpvoted = post.upvoters.includes(req.user._id);

    if (hasUpvoted) {
        // Remove upvote
        post.upvotes -= 1;
        post.upvoters = post.upvoters.filter(
            userId => userId.toString() !== req.user._id.toString()
        );
    } else {
        // Add upvote
        post.upvotes += 1;
        post.upvoters.push(req.user._id);

        // Create notification for post creator
        if (post.userId.toString() !== req.user._id.toString()) {
            const notification = new Notification({
                user: post.userId,
                type: 'upvote',
                message: `${req.user.name} upvoted your startup idea "${post.title}"`,
                relatedPost: post._id,
                relatedUser: req.user._id
            });
            await notification.save();
        }
    }

    await post.save();
    await post.populate('upvoters', 'name avatar');

    res.json({
        upvotes: post.upvotes,
        upvoters: post.upvoters,
        hasUpvoted: !hasUpvoted
    });
}));

// @desc    Add comment to showcase post
// @route   POST /api/posts/:id/showcase-comments
// @access  Private
router.post('/:id/showcase-comments', protect, asyncHandler(async (req, res) => {
    const { text } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) {
        return res.status(404).json({ message: 'Post not found' });
    }

    if (post.type !== 'showcase') {
        return res.status(400).json({ message: 'Only showcase posts can use this comment endpoint' });
    }

    if (!text || text.trim() === '') {
        return res.status(400).json({ message: 'Comment text cannot be empty' });
    }

    const now = new Date();
    const timestamp = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()} at ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')} ${now.getHours() >= 12 ? 'pm' : 'am'}`;

    const comment = {
        user: req.user._id,
        text,
        timestamp,
        author: req.user.name,
        authorAvatar: req.user.avatar?.url || req.user.avatar || 'https://placehold.co/40x40/cccccc/000000?text=A'
    };

    post.comments.push(comment);
    post.commentCount = post.comments.length;
    await post.save();

    // Create notification for post creator
    if (post.userId.toString() !== req.user._id.toString()) {
        const notification = new Notification({
            user: post.userId,
            type: 'comment',
            message: `${req.user.name} commented on your startup idea "${post.title}"`,
            relatedPost: post._id,
            relatedUser: req.user._id
        });
        await notification.save();
    }

    // Populate the new comment with user data
    await post.populate('comments.user', 'name avatar');

    const newComment = post.comments[post.comments.length - 1];

    res.status(201).json(newComment);
}));

// @desc    Get showcase post comments with pagination
// @route   GET /api/posts/:id/showcase-comments
// @access  Public
router.get('/:id/showcase-comments', asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const post = await Post.findById(req.params.id)
        .populate('comments.user', 'name avatar')
        .select('comments');

    if (!post) {
        return res.status(404).json({ message: 'Post not found' });
    }

    if (post.type !== 'showcase') {
        return res.status(400).json({ message: 'Only showcase posts can use this comment endpoint' });
    }

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const comments = post.comments.slice(startIndex, endIndex);
    const totalComments = post.comments.length;

    res.json({
        comments,
        totalPages: Math.ceil(totalComments / limit),
        currentPage: page,
        totalComments
    });
}));

module.exports = router;