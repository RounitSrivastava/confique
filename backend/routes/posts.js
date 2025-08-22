const express = require('express');
const asyncHandler = require('express-async-handler');
const { Parser } = require('json2csv');
const Post = require('../models/Post');
const Registration = require('../models/Registration');
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

// @desc    Get all posts
// @route   GET /api/posts
// @access  Public (for approved posts), Private (for all posts as admin)
// FIXED: This route now correctly handles both public and private access.
router.get('/', asyncHandler(async (req, res) => {
    let posts;
    let isAdmin = false;

    // Attempt to verify token if provided, but don't fail if not present or invalid
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        const token = req.headers.authorization.split(' ')[1];
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await require('../models/User').findById(decoded.id).select('isAdmin');
            if (user && user.isAdmin) {
                isAdmin = true;
            }
        } catch (error) {
            // Token is invalid or expired, proceed as public user
            console.log("Invalid or expired token for GET /api/posts, serving public content.");
        }
    }

    if (isAdmin) {
        // Admin gets all posts (approved and pending)
        posts = await Post.find().sort({ timestamp: -1 });
    } else {
        // Public/non-admin users only get approved posts
        posts = await Post.find({ status: 'approved' }).sort({ timestamp: -1 });
    }
    res.json(posts);
}));


// @desc    Get all pending events (for admin approval)
// @route   GET /api/posts/pending-events
// @access  Private (Admin only)
router.get('/pending-events', protect, admin, asyncHandler(async (req, res) => {
    const pendingEvents = await Post.find({ type: 'event', status: 'pending' }).sort({ timestamp: 1 });
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

    if (event.type !== 'event') {
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

    const {
        type, title, content, images,
        location, eventStartDate, eventEndDate,
        price, language, duration, ticketsNeeded, venueAddress, registrationLink,
        registrationOpen, enableRegistrationForm, registrationFields,
        paymentMethod, paymentLink, paymentQRCode,
        source
    } = req.body;

    let imageUrls = [];
    if (images && Array.isArray(images) && images.length > 0) {
        imageUrls = await Promise.all(images.map(uploadImage));
    } else if (images && typeof images === 'string') {
        imageUrls = [await uploadImage(images)];
    }

    let qrCodeUrl = null;
    if (paymentQRCode) {
        qrCodeUrl = await uploadImage(paymentQRCode);
    }

    const status = type === 'event' ? 'pending' : 'approved';

    const post = new Post({
        type,
        title,
        content,
        images: imageUrls.filter(url => url !== null),
        author: authorNameFromUser,
        authorAvatar: authorAvatarFinal,
        userId: userId,
        status: status,
        source: type === 'event' ? source : undefined,

        location: type === 'event' ? location : undefined,
        eventStartDate: type === 'event' ? eventStartDate : undefined,
        eventEndDate: type === 'event' ? eventEndDate : undefined,
        price: type === 'event' ? price : undefined,
        language: type === 'event' ? language : undefined,
        duration: type === 'event' ? duration : undefined,
        ticketsNeeded: type === 'event' ? ticketsNeeded : undefined,
        venueAddress: type === 'event' ? venueAddress : undefined,
        registrationLink: type === 'event' ? registrationLink : undefined,
        registrationOpen: type === 'event' ? registrationOpen : undefined,
        enableRegistrationForm: type === 'event' ? enableRegistrationForm : undefined,
        registrationFields: type === 'event' ? registrationFields : undefined,
        paymentMethod: type === 'event' ? paymentMethod : undefined,
        paymentLink: type === 'event' ? paymentLink : undefined,
        paymentQRCode: qrCodeUrl,

        likes: 0,
        likedBy: [],
        commentData: [],
        timestamp: new Date(),
    });

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

    const { type, title, content, images, paymentQRCode, source, status, ...rest } = req.body;

    post.type = type !== undefined ? type : post.type;
    post.title = title !== undefined ? title : post.title;
    post.content = content !== undefined ? content : post.content;
    post.source = type === 'event' ? (source !== undefined ? source : post.source) : undefined;

    if (req.user.isAdmin && status !== undefined) {
        post.status = status;
    }

    if (images !== undefined) {
        const oldImagePublicIds = post.images.map(url => {
            const parts = url.split('/');
            const filename = parts[parts.length - 1];
            return `confique_posts/${filename.split('.')[0]}`;
        }).filter(id => id.startsWith('confique_posts/'));

        if (oldImagePublicIds.length > 0) {
            try {
                await cloudinary.api.delete_resources(oldImagePublicIds);
            } catch (cloudinaryErr) {
                console.error('Cloudinary deletion failed for some old images:', cloudinaryErr);
            }
        }

        const newImageArray = Array.isArray(images) ? images : (images ? [images] : []);
        const newImageUrls = await Promise.all(newImageArray.map(uploadImage));
        post.images = newImageUrls.filter(url => url !== null);
    }

    if (paymentQRCode !== undefined) {
        if (post.paymentQRCode && post.paymentQRCode.includes('cloudinary')) {
            const parts = post.paymentQRCode.split('/');
            const filename = parts[parts.length - 1];
            try {
                await cloudinary.uploader.destroy(`confique_posts/${filename.split('.')[0]}`);
            } catch (cloudinaryErr) {
                console.error('Cloudinary deletion failed for old QR code:', cloudinaryErr);
            }
        }
        post.paymentQRCode = paymentQRCode ? await uploadImage(paymentQRCode) : null;
    }

    if (post.type === 'event') {
        post.location = rest.location !== undefined ? rest.location : post.location;
        post.eventStartDate = rest.eventStartDate !== undefined ? rest.eventStartDate : post.eventStartDate;
        post.eventEndDate = rest.eventEndDate !== undefined ? rest.eventEndDate : post.eventEndDate;
        post.price = rest.price !== undefined ? rest.price : post.price;
        post.language = rest.language !== undefined ? rest.language : post.language;
        post.duration = rest.duration !== undefined ? rest.duration : post.duration;
        post.ticketsNeeded = rest.ticketsNeeded !== undefined ? rest.ticketsNeeded : post.ticketsNeeded;
        post.venueAddress = rest.venueAddress !== undefined ? rest.venueAddress : post.venueAddress;
        post.registrationLink = rest.registrationLink !== undefined ? rest.registrationLink : post.registrationLink;
        post.registrationOpen = rest.registrationOpen !== undefined ? (rest.registrationOpen === 'true' || rest.registrationOpen === true) : post.registrationOpen;
        post.enableRegistrationForm = rest.enableRegistrationForm !== undefined ? (rest.enableRegistrationForm === 'true' || rest.enableRegistrationForm === true) : post.enableRegistrationForm;
        post.registrationFields = rest.registrationFields !== undefined ? rest.registrationFields : post.registrationFields;
        post.paymentMethod = rest.paymentMethod !== undefined ? rest.paymentMethod : post.paymentMethod;
        post.paymentLink = rest.paymentLink !== undefined ? rest.paymentLink : post.paymentLink;
        post.paymentQRCode = rest.paymentQRCode !== undefined ? rest.paymentQRCode : post.paymentQRCode;
    } else {
        post.location = undefined;
        post.eventStartDate = undefined;
        post.eventEndDate = undefined;
        post.price = undefined;
        post.language = undefined;
        post.duration = undefined;
        post.ticketsNeeded = undefined;
        post.venueAddress = undefined;
        post.registrationLink = undefined;
        post.registrationOpen = undefined;
        post.enableRegistrationForm = undefined;
        post.registrationFields = undefined;
        post.paymentMethod = undefined;
        post.paymentLink = undefined;
        post.paymentQRCode = undefined;
        post.source = undefined;
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
        if (event.type !== 'event') {
            return res.status(400).json({ message: 'Only events can be approved through this route' });
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
        if (event.type !== 'event') {
            return res.status(400).json({ message: 'Only events can be rejected through this route' });
        }
        
        const publicIdsToDelete = [];
        if (event.images && event.images.length > 0) {
            event.images.forEach(url => {
                const parts = url.split('/');
                const filename = parts[parts.length - 1];
                publicIdsToDelete.push(`confique_posts/${filename.split('.')[0]}`);
            });
        }
        if (event.paymentQRCode) {
            const parts = event.paymentQRCode.split('/');
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
        if (post.paymentQRCode) {
            const parts = post.paymentQRCode.split('/');
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
        if (post.type === 'event') {
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
    // Security check: Only the host or an admin can export this data
    if (event.userId.toString() !== req.user._id.toString() && !req.user.isAdmin) {
        return res.status(403).json({ message: 'Not authorized to export this data.' });
    }

    const registrations = await Registration.find({ eventId });
    if (registrations.length === 0) {
        return res.status(404).json({ message: 'No registrations found for this event.' });
    }

    let customFieldsSet = new Set();
    registrations.forEach(reg => {
        Object.keys(reg.customFields).forEach(field => customFieldsSet.add(field));
    });
    const customFields = [...customFieldsSet];

    const fields = ['Name', 'Email', 'Phone', ...customFields, 'Registered At'];

    const data = registrations.map(reg => {
        const row = {
            'Name': reg.name,
            'Email': reg.email,
            'Phone': reg.phone,
            'Registered At': reg.createdAt.toISOString(),
        };
        for (const field of customFields) {
            row[field] = reg.customFields[field] || '';
        }
        return row;
    });

    try {
        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(data);

        res.header('Content-Type', 'text/csv');
        res.attachment(`registrations_${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv`);
        res.send(csv);
    } catch (error) {
        console.error('CSV export error:', error);
        res.status(500).json({ message: 'Error generating CSV file.' });
    }
}));


module.exports = router;