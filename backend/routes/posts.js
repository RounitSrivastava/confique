const express = require('express');
const asyncHandler = require('express-async-handler');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const { protect, admin } = require('../middleware/auth');
const upload = require('../middleware/upload');
const cloudinary = require('cloudinary').v2;

const router = express.Router();

// Helper function to upload base64 images to Cloudinary
const uploadImage = async (image) => {
    if (!image) return null;
    try {
        const result = await cloudinary.uploader.upload(image, {
            folder: 'confique_posts', // Using a specific folder for post images
        });
        return result.secure_url;
    } catch (error) {
        console.error('Cloudinary upload failed:', error);
        return null;
    }
};

// --- POST ROUTES ---

// Get all posts (publicly accessible)
router.get('/', asyncHandler(async (req, res) => {
    const posts = await Post.find({})
        .sort({ timestamp: -1 });
    res.json(posts);
}));

// Get a single post by ID (publicly accessible)
router.get('/:id', asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id);
    if (post) {
        res.json(post);
    } else {
        res.status(404).json({ message: 'Post not found' });
    }
}));

// Create a new post (protected - only logged-in users can create)
router.post('/', protect, upload.none(), asyncHandler(async (req, res) => {
    // FIX: Get author and authorAvatar directly from req.user (authenticated user)
    // Add a fallback for authorAvatar to ensure it's never null
    const { _id: userId, name: authorNameFromUser, avatar: avatarFromUser } = req.user;
    const authorAvatarFinal = avatarFromUser || 'https://placehold.co/40x40/cccccc/000000?text=A';

    const {
        type, title, content, images, // 'author' field is intentionally not destructured from req.body
        location, eventStartDate, eventEndDate,
        price, language, duration, ticketsNeeded, venueAddress, registrationLink,
        registrationOpen, enableRegistrationForm, registrationFields,
        paymentMethod, paymentLink, paymentQRCode
    } = req.body;

    let imageUrls = [];
    if (images) {
        const imageArray = Array.isArray(images) ? images : [images];
        imageUrls = await Promise.all(imageArray.map(uploadImage));
    }
    
    let qrCodeUrl = null;
    if (paymentQRCode) {
        qrCodeUrl = await uploadImage(paymentQRCode);
    }

    const post = new Post({
        type,
        title,
        content,
        images: imageUrls.filter(url => url !== null),
        // FIX: Always use the authenticated user's name and the guaranteed avatar URL
        author: authorNameFromUser,
        authorAvatar: authorAvatarFinal,
        userId: userId,
        
        // Event-specific fields (only set if type is 'event')
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

// Update a post
router.put('/:id', protect, upload.none(), asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id);
    if (!post) {
        return res.status(404).json({ message: 'Post not found' });
    }
    
    // Authorization check: Only the post owner or an admin can update
    if (post.userId.toString() !== req.user._id.toString() && !req.user.isAdmin) {
        return res.status(403).json({ message: 'You are not authorized to update this post' });
    }

    // Destructure relevant fields from req.body.
    // FIX: Ensure 'author' is not taken from req.body, as it should be fixed to req.user.name
    const { type, title, content, images, paymentQRCode, author, ...rest } = req.body; 
    
    post.type = type !== undefined ? type : post.type;
    post.title = title !== undefined ? title : post.title;
    post.content = content !== undefined ? content : post.content;
    
    // FIX: Ensure author and authorAvatar are NOT updated from req.body.
    // They should only change if the user's profile changes (handled by users.js)
    // or if the post is explicitly being re-attributed (which is not the current goal).
    // The following lines ensure the author/avatar remain tied to the original user (or updated via profile change).
    // If you explicitly wanted to allow changing the author's *display name* for a post,
    // you would need different logic and a separate field, but for now, it's fixed.
    // post.author = req.user.name; // This would force update on every edit
    // post.authorAvatar = req.user.avatar || 'https://placehold.co/40x40/cccccc/000000?text=A'; // This too

    // Handle image updates
    if (images !== undefined) {
        // Delete old images from Cloudinary
        const oldImagePublicIds = post.images.map(url => {
            const parts = url.split('/');
            const filename = parts[parts.length - 1];
            return `confique_posts/${filename.split('.')[0]}`;
        }).filter(id => id.startsWith('confique_posts/')); // Ensure it's a Cloudinary public ID
        
        if (oldImagePublicIds.length > 0) {
            try {
                await cloudinary.api.delete_resources(oldImagePublicIds);
            } catch (cloudinaryErr) {
                console.error('Cloudinary deletion failed for some old images:', cloudinaryErr);
            }
        }
        
        // Upload new images
        const newImageArray = Array.isArray(images) ? images : (images ? [images] : []);
        const newImageUrls = await Promise.all(newImageArray.map(uploadImage));
        post.images = newImageUrls.filter(url => url !== null);
    }
    
    // Handle payment QR code updates
    if (paymentQRCode !== undefined) {
        // Delete old QR code from Cloudinary if it exists
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

    // Update event-specific fields based on type
    if (post.type === 'event') { // Use post.type here to ensure consistency
        post.location = rest.location !== undefined ? rest.location : post.location;
        post.eventStartDate = rest.eventStartDate !== undefined ? rest.eventStartDate : post.eventStartDate;
        post.eventEndDate = rest.eventEndDate !== undefined ? rest.eventEndDate : post.eventEndDate;
        post.price = rest.price !== undefined ? rest.price : post.price;
        post.language = rest.language !== undefined ? rest.language : post.language;
        post.duration = rest.duration !== undefined ? rest.duration : post.duration;
        post.ticketsNeeded = rest.ticketsNeeded !== undefined ? rest.ticketsNeeded : post.ticketsNeeded;
        post.venueAddress = rest.venueAddress !== undefined ? rest.venueAddress : post.venueAddress;
        post.registrationLink = rest.registrationLink !== undefined ? rest.registrationLink : post.registrationLink;
        // Ensure boolean conversion for these fields
        post.registrationOpen = rest.registrationOpen !== undefined ? (rest.registrationOpen === 'true' || rest.registrationOpen === true) : post.registrationOpen;
        post.enableRegistrationForm = rest.enableRegistrationForm !== undefined ? (rest.enableRegistrationForm === 'true' || rest.enableRegistrationForm === true) : post.enableRegistrationForm;
        post.registrationFields = rest.registrationFields !== undefined ? rest.registrationFields : post.registrationFields;
        post.paymentMethod = rest.paymentMethod !== undefined ? rest.paymentMethod : post.paymentMethod;
        post.paymentLink = rest.paymentLink !== undefined ? rest.paymentLink : post.paymentLink;
    } else {
        // If changing type from event to non-event, clear event-specific fields
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
    }

    const updatedPost = await post.save();
    res.json(updatedPost);
}));

// Delete a post
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
        res.json({ message: 'Post removed' });
    } else {
        res.status(404).json({ message: 'Post not found' });
    }
}));

// Add a comment to a post
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

// Like a post
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

// Unlike a post
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

// Report a post
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