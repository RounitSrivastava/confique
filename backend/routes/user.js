const express = require('express');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

// Get user profile
// This route is used to fetch the current user's profile details
router.get('/profile', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      isAdmin: user.isAdmin,
      registrations: user.registrations, // Include registrations
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
}));

// Update user profile (specifically for the avatar)
// This route is used to update the user's profile image
router.put('/profile/avatar', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.avatar = req.body.avatar || user.avatar;

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      avatar: updatedUser.avatar,
      token: req.headers.authorization.split(' ')[1], // Return the same token
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
}));


// Register for an event
// This route records a user's registration for a specific event
router.post('/register-event/:id', protect, asyncHandler(async (req, res) => {
  const event = await Post.findById(req.params.id);
  const user = await User.findById(req.user._id);

  if (!event || !user) {
    return res.status(404).json({ message: 'Event or user not found' });
  }

  // Check if user is already registered
  const isRegistered = user.registrations.some(reg => reg.eventId.toString() === event._id.toString());
  if (isRegistered) {
    return res.status(400).json({ message: 'User is already registered for this event' });
  }

  const registrationData = {
    eventId: event._id,
    eventName: event.title,
    registeredAt: new Date(),
  };

  user.registrations.push(registrationData);
  await user.save();

  res.status(201).json({ message: 'Registration successful', registration: registrationData });
}));


// Admin endpoint to get all reported posts
// This is for the admin panel to view reported posts.
router.get('/admin/reported-posts', protect, admin, asyncHandler(async (req, res) => {
  const reportedPosts = await Notification.find({ reportReason: { $exists: true } })
    .populate('reporter', 'name email phone')
    .populate('postId', 'title');
  res.json(reportedPosts);
}));

// Admin endpoint to delete a post and its reports
// This is for the admin to take action on reported posts.
router.delete('/admin/delete-post/:id', protect, admin, asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (post) {
    await post.deleteOne();
    await Notification.deleteMany({ postId: req.params.id });
    res.json({ message: 'Post and associated reports removed' });
  } else {
    res.status(404).json({ message: 'Post not found' });
  }
}));

module.exports = router;