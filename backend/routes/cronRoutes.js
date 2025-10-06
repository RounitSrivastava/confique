const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Notification = require('../models/Notification');

// @desc    Cron job to clean up old notifications
// @route   GET /api/cron/cleanup
// @access  Public (or secured with a token/key)
router.get('/cleanup', asyncHandler(async (req, res) => {
    try {
        // Set a date filter to delete notifications older than 60 days
        const daysToKeep = 60;
        const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

        // Delete old notifications from the database
        const result = await Notification.deleteMany({ timestamp: { $lt: cutoffDate } });

        console.log(`Cron job for notification cleanup executed. Deleted ${result.deletedCount} notifications.`);
        res.status(200).json({ 
            message: `Cleanup successful. Deleted ${result.deletedCount} notifications.`
        });
    } catch (error) {
        console.error('Error during cron job cleanup:', error);
        res.status(500).json({ message: 'Error performing cleanup task.' });
    }
}));

module.exports = router;
// hfhihfi