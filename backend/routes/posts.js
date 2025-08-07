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

// Get all posts
router.get('/', asyncHandler(async (req, res) => {
  const posts = await Post.find({}).sort({ timestamp: -1 });
  res.json(posts);
}));

// Get a single post by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (post) {
    res.json(post);
  } else {
    res.status(404).json({ message: 'Post not found' });
  }
}));

// Create a new post
router.post('/', protect, upload.none(), asyncHandler(async (req, res) => {
  const { type, title, content, author, location, eventStartDate, eventEndDate, price, language, duration, ticketsNeeded, venueAddress, registrationLink, registrationOpen, enableRegistrationForm, registrationFields, paymentMethod, paymentLink, paymentQRCode, images } = req.body;

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
    author: type === 'event' ? req.user.name : author,
    authorAvatar: type === 'event' ? req.user.avatar : null,
    userId: req.user._id,
    location: type === 'event' ? location : null,
    eventStartDate: type === 'event' ? eventStartDate : null,
    eventEndDate: type === 'event' ? eventEndDate : null,
    price: type === 'event' ? price : null,
    language: type === 'event' ? language : null,
    duration: type === 'event' ? duration : null,
    ticketsNeeded: type === 'event' ? ticketsNeeded : null,
    venueAddress: type === 'event' ? venueAddress : null,
    registrationLink: type === 'event' ? registrationLink : null,
    registrationOpen: type === 'event' ? registrationOpen : null,
    enableRegistrationForm: type === 'event' ? enableRegistrationForm : null,
    registrationFields: type === 'event' ? registrationFields : null,
    paymentMethod: type === 'event' ? paymentMethod : null,
    paymentLink: type === 'event' ? paymentLink : null,
    paymentQRCode: qrCodeUrl,
  });

  const createdPost = await post.save();
  res.status(201).json(createdPost);
}));


// Update a post
router.put('/:id', protect, asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id);
    if (!post) {
        return res.status(404).json({ message: 'Post not found' });
    }
    
    if (post.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'You are not authorized to update this post' });
    }

    const { type, title, content, author, ...rest } = req.body;
    
    // Update the simple fields
    post.title = title || post.title;
    post.content = content || post.content;
    post.author = author || post.author;

    // Handle image updates
    if (rest.images) {
      // First, delete old images from Cloudinary
      const oldImagePublicIds = post.images.map(url => {
          const parts = url.split('/');
          const filename = parts[parts.length - 1];
          return `confique_posts/${filename.split('.')[0]}`;
      });
      await cloudinary.api.delete_resources(oldImagePublicIds);
      
      // Upload new images
      const newImageArray = Array.isArray(rest.images) ? rest.images : [rest.images];
      const newImageUrls = await Promise.all(newImageArray.map(uploadImage));
      post.images = newImageUrls.filter(url => url !== null);
    }
    
    if (rest.paymentQRCode) {
        if (post.paymentQRCode) {
            const parts = post.paymentQRCode.split('/');
            const filename = parts[parts.length - 1];
            await cloudinary.uploader.destroy(`confique_posts/${filename.split('.')[0]}`);
        }
        post.paymentQRCode = await uploadImage(rest.paymentQRCode);
    }

    // Update event-specific fields
    Object.keys(rest).forEach(key => {
        post[key] = rest[key];
    });

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

    const publicIds = [...post.images, post.paymentQRCode].filter(url => url).map(url => {
      const parts = url.split('/');
      const filename = parts[parts.length - 1];
      return `confique_posts/${filename.split('.')[0]}`;
    });

    await cloudinary.api.delete_resources(publicIds);

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
    const newComment = {
      author: req.user.name,
      authorAvatar: req.user.avatar,
      text,
      timestamp: new Date(),
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
    post.likes += 1;
    await post.save();
    res.json({ likes: post.likes });
  } else {
    res.status(404).json({ message: 'Post not found' });
  }
}));

// Unlike a post
router.put('/:id/unlike', protect, asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (post) {
    if (post.likes > 0) {
      post.likes -= 1;
    }
    await post.save();
    res.json({ likes: post.likes });
  } else {
    res.status(404).json({ message: 'Post not found' });
  }
}));

// Report a post
router.post('/:id/report', protect, asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const post = await Post.findById(req.params.id);

  if (post) {
    const notification = new Notification({
      message: `Post "${post.title}" has been reported for: ${reason}`,
      reporter: req.user._id,
      postId: post._id,
      reportReason: reason,
    });
    await notification.save();
    res.status(201).json({ message: 'Post reported successfully' });
  } else {
    res.status(404).json({ message: 'Post not found' });
  }
}));

module.exports = router;