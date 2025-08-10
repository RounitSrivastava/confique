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
      folder: 'confique_posts',
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
    .sort({ timestamp: -1 })
    ;
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
  const {
    type, title, content, author, location, eventStartDate, eventEndDate,
    price, language, duration, ticketsNeeded, venueAddress, registrationLink,
    registrationOpen, enableRegistrationForm, registrationFields,
    paymentMethod, paymentLink, paymentQRCode, images
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
    // FIXED: The authorAvatar is now correctly set to the logged-in user's avatar
    // for all post types, with a placeholder fallback.
    author: type === 'event' ? req.user.name : (author || 'Anonymous'),
    authorAvatar: req.user.avatar || 'https://placehold.co/40x40/cccccc/000000?text=A',
    userId: req.user._id,
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
  
  if (post.userId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'You are not authorized to update this post' });
  }

  const { type, title, content, author, images, paymentQRCode, ...rest } = req.body;
  
  post.type = type || post.type;
  post.title = title || post.title;
  post.content = content || post.content;
  
  if (type === 'confession') {
    post.author = author || 'Anonymous';
  }

  if (images !== undefined) {
    const oldImagePublicIds = post.images.map(url => {
      const parts = url.split('/');
      const filename = parts[parts.length - 1];
      return `confique_posts/${filename.split('.')[0]}`;
    });
    if (oldImagePublicIds.length > 0) {
      await cloudinary.api.delete_resources(oldImagePublicIds);
    }
    
    const newImageArray = Array.isArray(images) ? images : (images ? [images] : []);
    const newImageUrls = await Promise.all(newImageArray.map(uploadImage));
    post.images = newImageUrls.filter(url => url !== null);
  }
  
  if (paymentQRCode !== undefined) {
    if (post.paymentQRCode) {
      const parts = post.paymentQRCode.split('/');
      const filename = parts[parts.length - 1];
      await cloudinary.uploader.destroy(`confique_posts/${filename.split('.')[0]}`);
    }
    post.paymentQRCode = paymentQRCode ? await uploadImage(paymentQRCode) : null;
  }

  if (type === 'event') {
    post.location = rest.location;
    post.eventStartDate = rest.eventStartDate;
    post.eventEndDate = rest.eventEndDate;
    post.price = rest.price;
    post.language = rest.language;
    post.duration = rest.duration;
    post.ticketsNeeded = rest.ticketsNeeded;
    post.venueAddress = rest.venueAddress;
    post.registrationLink = rest.registrationLink;
    post.registrationOpen = rest.registrationOpen === 'true' || rest.registrationOpen === true;
    post.enableRegistrationForm = rest.enableRegistrationForm === 'true' || rest.enableRegistrationForm === true;
    post.registrationFields = rest.registrationFields;
    post.paymentMethod = rest.paymentMethod;
    post.paymentLink = rest.paymentLink;
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