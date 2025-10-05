const express = require('express');
const asyncHandler = require('express-async-handler');
const { Parser } = require('json2csv');
const { Post, Registration } = require('../models/Post');
const Notification = require('../models/Notification');
const { protect, admin } = require('../middleware/auth');
const cloudinary = require('cloudinary').v2;
const jwt = require('jsonwebtoken');

const router = express.Router();

// CORRECTED: Utility function returns an object with publicId
const uploadImage = async (image) => {
    if (!image) return null;
    try {
        const result = await cloudinary.uploader.upload(image, {
            folder: 'confique_posts',
        });
        return { url: result.secure_url, publicId: result.public_id };
    } catch (error) {
        console.error('Cloudinary upload failed:', error);
        return null;
    }
};

// CORRECTED: Utility for reliable deletion using publicIds
const deleteCloudinaryResources = async (publicIds) => {
    if (!publicIds || publicIds.length === 0) return;
    try {
        await cloudinary.api.delete_resources(publicIds);
        console.log(`Successfully deleted resources: ${publicIds.join(', ')}`);
    } catch (cloudinaryErr) {
        console.error('Cloudinary deletion failed:', cloudinaryErr);
    }
};

// --- POST ROUTES ---

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
            const user = await require('../models/User').findById(decoded.id).select('isAdmin');
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
    const authorAvatarFinal = avatarFromUser || 'https://placehold.co/40x40/cccccc/000000?text=A';

    const { type, images, paymentQRCode, culturalPaymentQRCode, ...postData } = req.body;
    
    // CORRECTED: Process images, ensuring uploadImage returns an object
    const uploadedImages = await Promise.all(
        (Array.isArray(images) ? images : (images ? [images] : []))
        .map(image => uploadImage(image))
    );
    postData.images = uploadedImages.filter(img => img);

    // CORRECTED: Process QR code, ensuring uploadImage returns an object
    if (type === 'event' && paymentQRCode) {
        postData.paymentQRCode = await uploadImage(paymentQRCode);
    } else if (type === 'culturalEvent' && culturalPaymentQRCode) {
        postData.culturalPaymentQRCode = await uploadImage(culturalPaymentQRCode);
    }
    
    // Add default post details
    postData.type = type;
    postData.author = authorNameFromUser;
    postData.authorAvatar = authorAvatarFinal;
    postData.userId = userId;
    postData.status = (type === 'event' || type === 'culturalEvent') ? 'pending' : 'approved';
    postData.likes = 0;
    postData.likedBy = [];
    postData.commentData = [];
    postData.timestamp = new Date();

    const post = new Post(postData);
    const createdPost = await post.save();
    res.status(201).json(createdPost);
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

    const { images, paymentQRCode, culturalPaymentQRCode, ...updateData } = req.body;
    
    // CORRECTED: Handle image updates robustly
    if (images !== undefined) {
        const oldImagePublicIds = post.images.map(img => img.publicId).filter(id => id);
        await deleteCloudinaryResources(oldImagePublicIds);
        
        const newImageArray = Array.isArray(images) ? images : (images ? [images] : []);
        const newImageObjects = await Promise.all(newImageArray.map(uploadImage));
        updateData.images = newImageObjects.filter(img => img);
    }

    // CORRECTED: Handle QR code updates robustly
    if (post.type === 'event' && paymentQRCode !== undefined) {
        if (post.paymentQRCode && post.paymentQRCode.publicId) {
            await deleteCloudinaryResources([post.paymentQRCode.publicId]);
        }
        updateData.paymentQRCode = paymentQRCode ? await uploadImage(paymentQRCode) : null;
    } else if (post.type === 'culturalEvent' && culturalPaymentQRCode !== undefined) {
        if (post.culturalPaymentQRCode && post.culturalPaymentQRCode.publicId) {
            await deleteCloudinaryResources([post.culturalPaymentQRCode.publicId]);
        }
        updateData.culturalPaymentQRCode = culturalPaymentQRCode ? await uploadImage(culturalPaymentQRCode) : null;
    }

    // Update post fields
    Object.assign(post, updateData);

    // Admin can update status
    if (req.user.isAdmin && updateData.status !== undefined) {
        post.status = updateData.status;
    }

    const updatedPost = await post.save();
    res.json(updatedPost);
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
        
        const publicIdsToDelete = event.images.map(img => img.publicId).filter(id => id);
        if (event.paymentQRCode && event.paymentQRCode.publicId) publicIdsToDelete.push(event.paymentQRCode.publicId);
        if (event.culturalPaymentQRCode && event.culturalPaymentQRCode.publicId) publicIdsToDelete.push(event.culturalPaymentQRCode.publicId);

        await deleteCloudinaryResources(publicIdsToDelete);

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

        const publicIdsToDelete = post.images.map(img => img.publicId).filter(id => id);
        if (post.paymentQRCode && post.paymentQRCode.publicId) publicIdsToDelete.push(post.paymentQRCode.publicId);
        if (post.culturalPaymentQRCode && post.culturalPaymentQRCode.publicId) publicIdsToDelete.push(post.culturalPaymentQRCode.publicId);

        await deleteCloudinaryResources(publicIdsToDelete);

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
        const newComment = {
            author: req.user.name,
            authorAvatar: req.user.avatar || 'https://placehold.co/40x40/cccccc/000000?text=A',
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

// NEW ROUTE: GET /api/posts/export-registrations/:eventId
router.get('/export-registrations/:eventId', protect, asyncHandler(async (req, res) => {
    const { eventId } = req.params;
    const event = await Post.findById(eventId);
    
    if (!event) {
        return res.status(404).json({ message: 'Event not found.' });
    }
    
    if (event.userId.toString() !== req.user._id.toString() && !req.user.isAdmin) {
        return res.status(403).json({ message: 'Not authorized to export this data.' });
    }
    
    const registrations = await Registration.find({ eventId }).lean();
    if (registrations.length === 0) {
        return res.status(404).json({ message: 'No registrations found for this event.' });
    }

    const headers = new Set(['Name', 'Email']);
    const flattenedData = [];

    registrations.forEach(reg => {
        const baseData = {
            'Name': reg.name,
            'Email': reg.email,
        };
        
        if (reg.phone) baseData['Phone'] = reg.phone;
        if (reg.transactionId) baseData['Transaction ID'] = reg.transactionId;
        
        if (reg.customFields) {
            for (const key of Object.keys(reg.customFields)) {
                baseData[key] = reg.customFields[key];
            }
        }
        
        if (reg.selectedTickets && reg.selectedTickets.length > 0) {
            return reg.selectedTickets.map(ticket => {
                headers.add('Booking Dates');
                headers.add('Ticket Type');
                headers.add('Ticket Quantity');
                headers.add('Ticket Price');
                headers.add('Total Price');
                headers.add('Registered At');
                flattenedData.push({
                    ...baseData,
                    'Booking Dates': reg.bookingDates?.join(', ') || '',
                    'Ticket Type': ticket.ticketType,
                    'Ticket Quantity': ticket.quantity,
                    'Ticket Price': ticket.ticketPrice,
                    'Total Price': reg.totalPrice,
                    'Registered At': reg.createdAt.toISOString(),
                });
            });
        } else {
            flattenedData.push({
                ...baseData,
                'Booking Dates': reg.bookingDates?.join(', ') || '',
                'Total Price': reg.totalPrice,
                'Registered At': reg.createdAt.toISOString(),
            });
        }
    });

    const finalHeaders = Array.from(headers);

    try {
        const json2csvParser = new Parser({ fields: finalHeaders });
        const csv = json2csvParser.parse(flattenedData);

        res.header('Content-Type', 'text/csv');
        res.attachment(`registrations_${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv`);
        res.send(csv);
    } catch (error) {
        console.error('CSV export error:', error);
        res.status(500).json({ message: 'Error generating CSV file.' });
    }
}));

module.exports = router; 