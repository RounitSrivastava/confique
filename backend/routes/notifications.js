const express = require('express');
const asyncHandler = require('express-async-handler');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all notifications for the current user
// @route   GET /api/notifications
// @access  Private
// UPDATED: Now filters notifications to keep them for a set number of days.
router.get('/', protect, asyncHandler(async (req, res) => {
    // Set a date filter to keep notifications for the last 5 days
    const daysToKeep = 5;
    const expirationDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

    const notifications = await Notification.find({
        recipient: req.user._id,
        // NEW: Filter out notifications older than the expirationDate
        timestamp: { $gte: expirationDate }
    })
    .sort({ timestamp: -1 }) // Sort by newest first
    .limit(50); // Increased the limit for a better user experience

    res.json(notifications);
}));

module.exports = router;