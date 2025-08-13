// routes/notifications.js

const express = require('express');
const asyncHandler = require('express-async-handler');
const Notification = require('../models/Notification'); // Assuming you have a Notification model
const { protect } = require('../middleware/auth'); // Import authentication middleware

const router = express.Router();

// @desc    Get all notifications for the current user
// @route   GET /api/notifications
// @access  Private
router.get('/', protect, asyncHandler(async (req, res) => {
    // Fetch notifications where the recipient is the authenticated user
    const notifications = await Notification.find({ recipient: req.user._id })
        .sort({ timestamp: -1 }) // Sort by newest first
        .limit(20); // Limit to a reasonable number of notifications

    res.json(notifications);
}));

module.exports = router;