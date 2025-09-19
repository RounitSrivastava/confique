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

// ... (other post routes like GET, PUT, DELETE, etc. remain unchanged)

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
        if (reg.paymentScreenshot) headers.add('Payment Screenshot'); // FIX: Added header

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
            'Payment Screenshot': reg.paymentScreenshot || '', // FIX: Added data field
        };
        
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