const express = require('express');
const asyncHandler = require('express-async-handler');
const Post = require('../models/Post'); // Ensure your Post model has the likedBy array
const Notification = require('../models/Notification');
const { protect, admin } = require('../middleware/auth');
const upload = require('../middleware/upload'); // Assuming this is configured for multipart/form-data parsing
const cloudinary = require('cloudinary').v2;

const router = express.Router();

// Helper function to upload base64 images to Cloudinary
const uploadImage = async (image) => {
  if (!image) return null;
  try {
    const result = await cloudinary.uploader.upload(image, {
      folder: 'confique_posts', // Cloudinary folder to store images
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
    // Populate likedBy to easily check if current user has liked
    // However, for fetching all posts, it's more efficient to just get post IDs from the frontend
    // or handle liked status client-side based on a separate /users/liked-posts call.
    // For now, no population needed here.
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
  // Ensure images is an array, then process each
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
    images: imageUrls.filter(url => url !== null), // Filter out any failed uploads
    // For events, author is the logged-in user's name/avatar. For confessions, it can be user-defined or anonymous.
    author: type === 'event' ? req.user.name : (author || 'Anonymous'),
    authorAvatar: type === 'event' ? req.user.avatar : null, // Assuming anonymous confessions don't have an avatar
    userId: req.user._id, // Store the ID of the user who created the post
    // Event-specific fields
    location: type === 'event' ? location : undefined, // Use undefined to not save if not an event
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
    likes: 0, // Initialize likes to 0
    likedBy: [], // Initialize likedBy as an empty array
    commentData: [], // Initialize comments as an empty array
  });

  const createdPost = await post.save();
  res.status(201).json(createdPost);
}));

// Update a post (protected - only the author or admin can update)
// IMPORTANT: Add upload.none() to handle base64 image data in req.body for PUT requests
router.put('/:id', protect, upload.none(), asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }
  
  // Check if the current user is the author of the post
  if (post.userId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'You are not authorized to update this post' });
  }

  const { type, title, content, author, images, paymentQRCode, ...rest } = req.body;
  
  // Update the simple fields
  post.type = type || post.type; // Type might also be updated
  post.title = title || post.title;
  post.content = content || post.content;
  
  // Handle author for confessions (events' author is fixed to creator)
  if (type === 'confession') {
    post.author = author || 'Anonymous';
  }

  // Handle image updates: only if new images array is provided in the request
  if (images !== undefined) { // Check for undefined, allowing empty array to clear images
    // Delete old images from Cloudinary before uploading new ones
    const oldImagePublicIds = post.images.map(url => {
      const parts = url.split('/');
      const filename = parts[parts.length - 1];
      return `confique_posts/${filename.split('.')[0]}`; // Extract public ID
    });
    // Use `cloudinary.api.delete_resources` for multiple deletions
    if (oldImagePublicIds.length > 0) {
      await cloudinary.api.delete_resources(oldImagePublicIds);
    }
    
    // Upload new images
    const newImageArray = Array.isArray(images) ? images : (images ? [images] : []);
    const newImageUrls = await Promise.all(newImageArray.map(uploadImage));
    post.images = newImageUrls.filter(url => url !== null);
  }
  
  // Handle QR code image update
  if (paymentQRCode !== undefined) { // Check for undefined, allowing empty string to clear QR code
    if (post.paymentQRCode) {
      const parts = post.paymentQRCode.split('/');
      const filename = parts[parts.length - 1];
      await cloudinary.uploader.destroy(`confique_posts/${filename.split('.')[0]}`);
    }
    post.paymentQRCode = paymentQRCode ? await uploadImage(paymentQRCode) : null;
  }

  // Update event-specific fields (if type is event)
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
    // Ensure registrationOpen is a boolean
    post.registrationOpen = rest.registrationOpen === 'true' || rest.registrationOpen === true;
    post.enableRegistrationForm = rest.enableRegistrationForm === 'true' || rest.enableRegistrationForm === true;
    post.registrationFields = rest.registrationFields;
    post.paymentMethod = rest.paymentMethod;
    post.paymentLink = rest.paymentLink;
    // paymentQRCode is handled separately above
  } else {
    // If type changes from event to confession, clear event-specific fields
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


// Delete a post (protected - only the author or admin can delete)
router.delete('/:id', protect, asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (post) {
    // Check if the current user is the author or an admin
    if (post.userId.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: 'You are not authorized to delete this post' });
    }

    // Prepare public IDs for Cloudinary deletion
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

    // Delete resources from Cloudinary
    if (publicIdsToDelete.length > 0) {
      try {
        await cloudinary.api.delete_resources(publicIdsToDelete);
      } catch (cloudinaryErr) {
        console.error('Cloudinary deletion failed for some resources:', cloudinaryErr);
        // Continue with post deletion in DB even if Cloudinary deletion fails
      }
    }

    await post.deleteOne(); // Use deleteOne() for Mongoose 5+
    res.json({ message: 'Post removed' });
  } else {
    res.status(404).json({ message: 'Post not found' });
  }
}));

// Add a comment to a post (protected)
router.post('/:id/comments', protect, asyncHandler(async (req, res) => {
  const { text } = req.body;
  const post = await Post.findById(req.params.id);

  if (post) {
    if (!text || text.trim() === '') {
      return res.status(400).json({ message: 'Comment text cannot be empty' });
    }
    const newComment = {
      author: req.user.name,
      authorAvatar: req.user.avatar || 'https://placehold.co/40x40/cccccc/000000?text=A', // Use a default placeholder if avatar is null
      text,
      timestamp: new Date(),
      userId: req.user._id, // Store userId for comments
    };
    post.commentData.push(newComment);
    post.comments = post.commentData.length; // Update comments count
    await post.save();
    res.status(201).json(post.commentData); // Return updated comment list
  } else {
    res.status(404).json({ message: 'Post not found' });
  }
}));

// Like a post (protected - checks for unique like)
router.put('/:id/like', protect, asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (post) {
    // Check if the user has already liked this post
    if (post.likedBy.includes(req.user._id)) {
      return res.status(400).json({ message: 'You have already liked this post' });
    }

    post.likes += 1;
    post.likedBy.push(req.user._id); // Add user's ID to likedBy array
    await post.save();
    res.json({ likes: post.likes, likedBy: post.likedBy });
  } else {
    res.status(404).json({ message: 'Post not found' });
  }
}));

// Unlike a post (protected - checks if user has liked it previously)
router.put('/:id/unlike', protect, asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (post) {
    // Check if the user has liked this post
    if (!post.likedBy.includes(req.user._id)) {
      return res.status(400).json({ message: 'You have not liked this post' });
    }

    if (post.likes > 0) {
      post.likes -= 1;
    }
    // Remove user's ID from likedBy array
    post.likedBy = post.likedBy.filter(userId => userId.toString() !== req.user._id.toString());
    
    await post.save();
    res.json({ likes: post.likes, likedBy: post.likedBy });
  } else {
    res.status(404).json({ message: 'Post not found' });
  }
}));

// Report a post (protected)
router.post('/:id/report', protect, asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const post = await Post.findById(req.params.id);

  if (post) {
    if (!reason || reason.trim() === '') {
      return res.status(400).json({ message: 'Report reason cannot be empty' });
    }
    const notification = new Notification({
      message: `Post "${post.title}" has been reported by ${req.user.name} for: ${reason}`,
      reporter: req.user._id, // User who reported
      postId: post._id,       // ID of the reported post
      reportReason: reason,   // Specific reason provided
      // Add a field to indicate this is an admin notification type if your Notification model supports it
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