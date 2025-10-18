const express = require('express');
const asyncHandler = require('express-async-handler');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all notifications for the current user
// @route   GET /api/notifications
// @access  Private
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

// ==============================================
// NEW STARTUP SHOWCASE NOTIFICATION ROUTES
// ==============================================

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
router.put('/:id/read', protect, asyncHandler(async (req, res) => {
    const notification = await Notification.findOneAndUpdate(
        { 
            _id: req.params.id, 
            recipient: req.user._id 
        },
        { 
            isRead: true,
            readAt: new Date()
        },
        { new: true }
    );

    if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
    }

    res.json(notification);
}));

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
router.put('/read-all', protect, asyncHandler(async (req, res) => {
    await Notification.updateMany(
        { 
            recipient: req.user._id, 
            isRead: false 
        },
        { 
            isRead: true,
            readAt: new Date()
        }
    );

    res.json({ message: 'All notifications marked as read' });
}));

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
router.get('/unread-count', protect, asyncHandler(async (req, res) => {
    const daysToKeep = 5;
    const expirationDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

    const count = await Notification.countDocuments({
        recipient: req.user._id,
        isRead: false,
        timestamp: { $gte: expirationDate }
    });

    res.json({ unreadCount: count });
}));

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
router.delete('/:id', protect, asyncHandler(async (req, res) => {
    const notification = await Notification.findOneAndDelete({
        _id: req.params.id,
        recipient: req.user._id
    });

    if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted successfully' });
}));

// @desc    Clear all notifications
// @route   DELETE /api/notifications/clear-all
// @access  Private
router.delete('/clear-all', protect, asyncHandler(async (req, res) => {
    await Notification.deleteMany({
        recipient: req.user._id
    });

    res.json({ message: 'All notifications cleared' });
}));

// @desc    Get notifications by type (for showcase filtering)
// @route   GET /api/notifications/type/:type
// @access  Private
router.get('/type/:type', protect, asyncHandler(async (req, res) => {
    const { type } = req.params;
    const daysToKeep = 5;
    const expirationDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

    const validTypes = ['upvote', 'comment', 'registration', 'report', 'system', 'showcase_upvote', 'showcase_comment'];
    
    if (!validTypes.includes(type)) {
        return res.status(400).json({ message: 'Invalid notification type' });
    }

    const notifications = await Notification.find({
        recipient: req.user._id,
        type: type,
        timestamp: { $gte: expirationDate }
    })
    .sort({ timestamp: -1 })
    .limit(50);

    res.json(notifications);
}));

// @desc    Get showcase-specific notifications
// @route   GET /api/notifications/showcase
// @access  Private
router.get('/showcase', protect, asyncHandler(async (req, res) => {
    const daysToKeep = 5;
    const expirationDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

    const notifications = await Notification.find({
        recipient: req.user._id,
        type: { $in: ['showcase_upvote', 'showcase_comment'] },
        timestamp: { $gte: expirationDate }
    })
    .sort({ timestamp: -1 })
    .limit(50);

    res.json(notifications);
}));

module.exports = router;