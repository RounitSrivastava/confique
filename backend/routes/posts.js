const express = require('express');
const asyncHandler = require('express-async-handler');
const { Parser } = require('json2csv');
const { Post, Registration } = require('../models/Post');
const Notification = require('../models/Notification');
const { protect, admin } = require('../middleware/auth');
const upload = require('../middleware/upload');
const cloudinary = require('cloudinary').v2;
const jwt = require('jsonwebtoken');

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

// --- POST ROUTES ---
// CRITICAL: Specific routes MUST come before generic parameterized routes

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

// @desc    Export registrations for a specific event to a CSV file
// @route   GET /api/posts/export-registrations/:eventId
// @access  Private (Event host or Admin)
router.get('/export-registrations/:eventId', protect, asyncHandler(async (req, res) => {
    const { eventId } = req.params;

    // 1. Verify the user is the host of the event or an admin
    const event = await Post.findById(eventId);
    if (!event) {
        return res.status(404).json({ message: 'Event not found.' });
    }
    if (event.userId.toString() !== req.user._id.toString() && !req.user.isAdmin) {
        return res.status(403).json({ message: 'Not authorized to export this data.' });
    }

    // 2. Fetch all registration data for the event
    const registrations = await Registration.find({ eventId }).lean();
    if (registrations.length === 0) {
        return res.status(404).json({ message: 'No registrations found for this event.' });
    }

    // 3. Dynamically discover all unique custom and standard fields and flatten the data
    const headers = new Set(['Name', 'Email', 'Phone', 'Transaction ID', 'Registered At']);
    const flattenedData = [];
    
    headers.add('Booking Dates');
    headers.add('Total Price');
    headers.add('Ticket Type');
    headers.add('Ticket Quantity');
    headers.add('Ticket Price');

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

    try {
        const json2csvParser = new Parser({ fields: finalHeaders });
        const csv = json2csvParser.parse(flattenedData);

        res.header('Content-Type', 'text/csv');
        const safeTitle = event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 50);
        res.attachment(`registrations_${safeTitle}_${eventId}.csv`);
        res.send(csv);
    } catch (error) {
        console.error('CSV export error:', error);
        res.status(500).json({ message: 'Error generating CSV file.' });
    }
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
// IMPORTANT: This MUST come after all specific routes
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
    
    // Process images
    let imageUrls = [];
    if (images && Array.isArray(images) && images.length > 0) {
        imageUrls = await Promise.all(images.map(uploadImage));
    } else if (images && typeof images === 'string') {
        imageUrls = [await uploadImage(images)];
    }

    // Process QR code
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
    } else {
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
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            console.error('Mongoose Validation Error:', messages.join(', '));
            return res.status(400).json({ message: `Validation Failed: ${messages.join(', ')}` });
        }
        throw error; 
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
            .map(url => url.includes('cloudinary') ? `confique_posts/${url.split('/').pop().split('.')[0]}` : null)
            .filter(id => id);

        if (oldImagePublicIds.length > 0) {
            try { await cloudinary.api.delete_resources(oldImagePublicIds); }
            catch (cloudinaryErr) { console.error('Cloudinary deletion failed for old images:', cloudinaryErr); }
        }

        const newImageArray = Array.isArray(images) ? images : (images ? [images] : []);
        const newImageUrls = await Promise.all(newImageArray.map(uploadImage));
        post.images = newImageUrls.filter(url => url !== null);
    }

    let newQrCodeUrl = undefined;
    let oldQrCodeUrl = post.type === 'event' ? post.paymentQRCode : post.culturalPaymentQRCode;
    let newQrCodeData = post.type === 'event' ? rest.paymentQRCode : rest.culturalPaymentQRCode;

    if (newQrCodeData !== undefined && newQrCodeData !== oldQrCodeUrl) {
        if (oldQrCodeUrl && oldQrCodeUrl.includes('cloudinary')) {
            const publicId = `confique_posts/${oldQrCodeUrl.split('/').pop().split('.')[0]}`;
            try { await cloudinary.uploader.destroy(publicId); }
            catch (cloudinaryErr) { console.error('Cloudinary deletion failed for old QR code:', cloudinaryErr); }
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
    } else {
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
                const parts = url.split('/');
                const filename = parts[parts.length - 1];
                publicIdsToDelete.push(`confique_posts/${filename.split('.')[0]}`);
            });
        }
        
        const qrCodeUrl = event.type === 'event' ? event.paymentQRCode : event.culturalPaymentQRCode;
        if (qrCodeUrl) {
            const parts = qrCodeUrl.split('/');
            const filename = parts[parts.length - 1];
            publicIdsToDelete.push(`confique_posts/${filename.split('.')[0]}`);
        }

        if (publicIdsToDelete.length > 0) {
            try {
                await cloudinary.api.delete_resources(publicIdsToDelete);
            } catch (cloudinaryErr) {
                console.error('Cloudinary deletion failed for some resources during rejection:', cloudinaryErr);
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
                const parts = url.split('/');
                const filename = parts[parts.length - 1];
                publicIdsToDelete.push(`confique_posts/${filename.split('.')[0]}`);
            });
        }
        
        const qrCodeUrl = post.type === 'event' ? post.paymentQRCode : post.culturalPaymentQRCode;
        if (qrCodeUrl) {
            const parts = qrCodeUrl.split('/');
            const filename = parts[parts.length - 1];
            publicIdsToDelete.push(`confique_posts/${filename.split('.')[0]}`);
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

module.exports = router;