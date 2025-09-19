const express = require('express');
const asyncHandler = require('express-async-handler');
const { Parser } = require('json2csv');
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

// --- POST ROUTES ---

// ... (other existing routes in postRoutes.js)

// @desc    Reject and delete a pending event
// @route   DELETE /api/posts/reject-event/:id
// @access  Private (Admin only)
router.delete('/reject-event/:id', protect, admin, asyncHandler(async (req, res) => {
    const event = await Post.findById(req.params.id);

    if (event) {
        if (!['event', 'culturalEvent'].includes(event.type)) {
            return res.status(400).json({ message: 'Only events and cultural events can be rejected through this route' });
        }
        
        const publicIdsToDelete = [];
        if (event.images && event.images.length > 0) {
            event.images.forEach(url => {
                const parts = url.split('/');
                const filename = parts[parts.length - 1];
                publicIdsToDelete.push(`confique_posts/${filename.split('.')[0]}`);
            });
        }
        
        const qrCodeUrl = event.type === 'event' ? event.paymentQRCode : event.culturalPaymentQRCode;
        if (qrCodeUrl) {
            const parts = qrCodeUrl.split('/');
            const filename = parts[parts.length - 1];
            publicIdsToDelete.push(`confique_posts/${filename.split('.')[0]}`);
        }
        // FIX: Add paymentScreenshot to be deleted
        const paymentScreenshotUrl = event.paymentScreenshot;
        if (paymentScreenshotUrl) {
            const parts = paymentScreenshotUrl.split('/');
            const filename = parts[parts.length - 1];
            publicIdsToDelete.push(`confique_payment_screenshots/${filename.split('.')[0]}`);
        }

        if (publicIdsToDelete.length > 0) {
            try {
                await cloudinary.api.delete_resources(publicIdsToDelete);
            } catch (cloudinaryErr) {
                console.error('Cloudinary deletion failed for some resources during rejection:', cloudinaryErr);
            }
        }

        await event.deleteOne();
        await Registration.deleteMany({ eventId: event._id });
        res.json({ message: 'Event rejected and removed' });
    } else {
        res.status(404).json({ message: 'Event not found' });
    }
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
        
        // FIX: Add paymentScreenshot to be deleted
        const paymentScreenshotUrl = post.paymentScreenshot;
        if (paymentScreenshotUrl) {
            const parts = paymentScreenshotUrl.split('/');
            const filename = parts[parts.length - 1];
            publicIdsToDelete.push(`confique_payment_screenshots/${filename.split('.')[0]}`);
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

// @desc    Export registrations for a specific event to a CSV file
// @route   GET /api/posts/export-registrations/:eventId
// @access  Private (Event host or Admin)
router.get('/export-registrations/:eventId', protect, asyncHandler(async (req, res) => {
    const { eventId } = req.params;

    const event = await Post.findById(eventId);
    if (!event) {
        return res.status(404).json({ message: 'Event not found.' });
    }
    if (event.userId.toString() !== req.user._id.toString() && !req.user.isAdmin) {
        return res.status(403).json({ message: 'Not authorized to export this data.' });
    }
    
    const registrations = await Registration.find({ eventId }).lean();
    if (registrations.length === 0) {
        return res.status(404).json({ message: 'No registrations found for this event.' });
    }

    const headers = new Set(['Name', 'Email']);

    // Gather all possible custom fields and other headers
    registrations.forEach(reg => {
        if (reg.phone) headers.add('Phone');
        if (reg.transactionId) headers.add('Transaction ID');
        // FIX: Add header for paymentScreenshot
        if (reg.paymentScreenshot) headers.add('Payment Screenshot');

        if (reg.customFields) {
            Object.keys(reg.customFields).forEach(key => headers.add(key));
        }
        if (reg.bookingDates && reg.bookingDates.length > 0) {
            headers.add('Booking Dates');
        }
        if (reg.selectedTickets && reg.selectedTickets.length > 0) {
            headers.add('Ticket Type');
            headers.add('Ticket Quantity');
            headers.add('Ticket Price');
            headers.add('Total Price');
        }
    });

    headers.add('Registered At');
    const finalHeaders = Array.from(headers);
    
    const data = registrations.flatMap(reg => {
        const baseRow = {
            'Name': reg.name,
            'Email': reg.email,
            'Phone': reg.phone || '',
            'Transaction ID': reg.transactionId || '',
            // FIX: Add paymentScreenshot URL to data row
            'Payment Screenshot': reg.paymentScreenshot || '',
        };
        
        // Add all custom fields dynamically to the base row
        if (reg.customFields) {
            for (const key of Object.keys(reg.customFields)) {
                baseRow[key] = reg.customFields[key] || '';
            }
        }

        if (reg.selectedTickets && reg.selectedTickets.length > 0) {
            return reg.selectedTickets.map(ticket => ({
                ...baseRow,
                'Booking Dates': (reg.bookingDates || []).join(', ') || '',
                'Ticket Type': ticket.ticketType || '',
                'Ticket Quantity': ticket.quantity || '',
                'Ticket Price': ticket.ticketPrice || '',
                'Total Price': reg.totalPrice || '',
                'Registered At': reg.createdAt.toISOString(),
            }));
        } else {
            return [{
                ...baseRow,
                'Booking Dates': (reg.bookingDates || []).join(', ') || '',
                'Registered At': reg.createdAt.toISOString(),
            }];
        }
    });

    try {
        const json2csvParser = new Parser({ fields: finalHeaders });
        const csv = json2csvParser.parse(data);

        res.header('Content-Type', 'text/csv');
        res.attachment(`registrations_${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv`);
        res.send(csv);
    } catch (error) {
        console.error('CSV export error:', error);
        res.status(500).json({ message: 'Error generating CSV file.' });
    }
}));

module.exports = router;