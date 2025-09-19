const express = require('express');
const asyncHandler = require('express-async-handler');
const { Post, Registration } = require('../models/Post'); 
const Notification = require('../models/Notification');
const { protect, admin } = require('../middleware/auth');
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
    
    postData.images = imageUrls.filter(url => url !== null);
    postData.type = type;
    postData.author = authorNameFromUser;
    postData.authorAvatar = authorAvatarFinal;
    postData.userId = userId;
    postData.status = (type === 'event' || type === 'culturalEvent') ? 'pending' : 'approved';
    postData.likes = 0;
    postData.likedBy = [];
    postData.commentData = [];
    postData.timestamp = new Date();

    if (type === 'event' && qrCodeUrl) {
        postData.paymentQRCode = qrCodeUrl;
    } else if (type === 'culturalEvent' && qrCodeUrl) {
        postData.culturalPaymentQRCode = qrCodeUrl;
    }

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

    const { type, title, content, images, status, ...rest } = req.body;

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

    let newQrCodeUrl = null;
    let oldQrCodeUrl = post.type === 'event' ? post.paymentQRCode : post.culturalPaymentQRCode;
    let newQrCodeData = post.type === 'event' ? rest.paymentQRCode : rest.culturalPaymentQRCode;

    if (newQrCodeData !== undefined && newQrCodeData !== oldQrCodeUrl) {
        if (oldQrCodeUrl && oldQrCodeUrl.includes('cloudinary')) {
            const publicId = `confique_posts/${oldQrCodeUrl.split('/').pop().split('.')[0]}`;
            try { await cloudinary.uploader.destroy(publicId); }
            catch (cloudinaryErr) { console.error('Cloudinary deletion failed for old QR code:', cloudinaryErr); }
        }
        newQrCodeUrl = newQrCodeData ? await uploadImage(newQrCodeData) : null;
    }

    post.set({
        type: type !== undefined ? type : post.type,
        title: title !== undefined ? title : post.title,
        content: content !== undefined ? content : post.content,
        ...rest,
    });

    if (req.user.isAdmin && status !== undefined) {
        post.status = status;
    }

    if (post.type === 'event') {
        post.paymentQRCode = newQrCodeUrl !== null ? newQrCodeUrl : post.paymentQRCode;
        post.ticketOptions = undefined;
        post.culturalPaymentMethod = undefined;
        post.culturalPaymentLink = undefined;
        post.culturalPaymentQRCode = undefined;
        post.availableDates = undefined;
    } else if (post.type === 'culturalEvent') {
        post.culturalPaymentQRCode = newQrCodeUrl !== null ? newQrCodeUrl : post.culturalPaymentQRCode;
        post.price = undefined;
        post.paymentMethod = undefined;
        post.paymentLink = undefined;
        post.paymentQRCode = undefined;
        post.language = undefined;
        post.source = undefined;
        post.ticketsNeeded = undefined;
        post.venueAddress = undefined;
    } else { // confession/news
        post.location = undefined;
        post.eventStartDate = undefined;
        post.eventEndDate = undefined;
        post.duration = undefined;
        post.price = undefined;
        post.language = undefined;
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
        post.ticketOptions = undefined;
        post.culturalPaymentMethod = undefined;
        post.culturalPaymentLink = undefined;
        post.culturalPaymentQRCode = undefined;
        post.availableDates = undefined;
    }

    const updatedPost = await post.save();
    res.json(updatedPost);
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