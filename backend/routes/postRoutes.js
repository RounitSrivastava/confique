const express = require('express');
const asyncHandler = require('express-async-handler');
const { Parser } = require('json2csv');
const { Post, Registration } = require('../models/Post'); 
const { protect, admin } = require('../middleware/auth'); 

const router = express.Router();

// ... (other existing routes in postRoutes.js)

// @desc    Export registrations for a specific event to a CSV file
// @route   GET /api/posts/export-registrations/:eventId
// @access  Private (Event host or Admin)
router.get('/export-registrations/:eventId', protect, asyncHandler(async (req, res) => {
    const { eventId } = req.params;

    // 1. Verify the user is the host of the event or an admin
    const event = await Post.findById(eventId);
    if (!event) {
        return res.status(404).json({ message: 'Event not found.' });
    }
    // Check if the user is the event's creator or an admin
    if (event.userId.toString() !== req.user._id.toString() && !req.user.isAdmin) {
        return res.status(403).json({ message: 'Not authorized to export this data.' });
    }

    // 2. Fetch all registration data for the event
    const registrations = await Registration.find({ eventId }).lean();
    if (registrations.length === 0) {
        return res.status(404).json({ message: 'No registrations found for this event.' });
    }

    // 3. Dynamically discover all unique custom and standard fields
    const allFields = new Set();
    const flattenedData = [];

    registrations.forEach(reg => {
        const baseData = {
            'Name': reg.name || '',
            'Email': reg.email || '',
            'Phone': reg.phone || '',
            'Transaction ID': reg.transactionId || '',
            // NEW: Add the payment screenshot URL to the base data
            'Payment Screenshot URL': reg.paymentScreenshot || '',
            'Registered At': reg.createdAt.toISOString(),
        };

        // Add all base fields to the set of headers
        Object.keys(baseData).forEach(key => allFields.add(key));

        // Add custom fields
        if (reg.customFields) {
            for (const key in reg.customFields) {
                if (Object.prototype.hasOwnProperty.call(reg.customFields, key)) {
                    baseData[key] = reg.customFields[key] || '';
                    allFields.add(key);
                }
            }
        }
        
        // Handle cultural event registrations with tickets
        if (event.type === 'culturalEvent' && reg.selectedTickets && reg.selectedTickets.length > 0) {
            // Add cultural event specific headers
            allFields.add('Booking Dates');
            allFields.add('Total Price');
            allFields.add('Ticket Type');
            allFields.add('Ticket Quantity');
            allFields.add('Ticket Price');
            
            // Create a separate row for each ticket
            reg.selectedTickets.forEach(ticket => {
                flattenedData.push({
                    ...baseData,
                    'Booking Dates': (reg.bookingDates || []).join(', '),
                    'Total Price': reg.totalPrice || '',
                    'Ticket Type': ticket.ticketType || '',
                    'Ticket Quantity': ticket.quantity || '',
                    'Ticket Price': ticket.ticketPrice || '',
                });
            });
        } else {
            // For standard events or cultural events with no tickets selected
            flattenedData.push({
                ...baseData,
                // Ensure these columns exist for a consistent schema, even if empty
                'Booking Dates': (reg.bookingDates || []).join(', '),
                'Total Price': reg.totalPrice || '',
                'Ticket Type': '',
                'Ticket Quantity': '',
                'Ticket Price': '',
            });
        }
    });

    const finalHeaders = Array.from(allFields);

    try {
        const json2csvParser = new Parser({ fields: finalHeaders });
        const csv = json2csvParser.parse(flattenedData);

        // 4. Set headers and send the CSV file as a download
        res.header('Content-Type', 'text/csv');
        res.attachment(`registrations_${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv`);
        res.send(csv);
    } catch (error) {
        console.error('CSV export error:', error);
        res.status(500).json({ message: 'Error generating CSV file.' });
    }
}));


module.exports = router;