const express = require('express');
const asyncHandler = require('express-async-handler');
const { Parser } = require('json2csv');
const { Post, Registration } = require('../models/Post'); 
const { protect } = require('../middleware/auth'); // Assuming protect is imported elsewhere in the file

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
    if (event.userId.toString() !== req.user._id.toString() && !req.user.isAdmin) {
        return res.status(403).json({ message: 'Not authorized to export this data.' });
    }

    // 2. Fetch all registration data for the event
    // Using .lean() for performance since we don't need Mongoose documents, just plain JS objects.
    const registrations = await Registration.find({ eventId }).lean();
    if (registrations.length === 0) {
        return res.status(404).json({ message: 'No registrations found for this event.' });
    }

    // 3. Dynamically discover all unique custom and standard fields and flatten the data
    const headers = new Set(['Name', 'Email', 'Phone', 'Transaction ID', 'Registered At']);
    const flattenedData = [];
    
    // Add common ticket-related headers to the set upfront, they will appear in the final CSV
    // even if they are empty for some rows.
    headers.add('Booking Dates');
    headers.add('Total Price');
    headers.add('Ticket Type');
    headers.add('Ticket Quantity');
    headers.add('Ticket Price');


    registrations.forEach(reg => {
        // Build the base data row from standard fields
        const baseData = {
            'Name': reg.name || '',
            'Email': reg.email || '',
            'Phone': reg.phone || '',
            'Transaction ID': reg.transactionId || '',
            'Registered At': reg.createdAt ? reg.createdAt.toISOString() : '', // Use toISOString
            'Booking Dates': (reg.bookingDates || []).join(', '),
            'Total Price': reg.totalPrice || '',
        };

        // Add custom fields to the base data and headers
        if (reg.customFields) {
            for (const key in reg.customFields) {
                if (Object.prototype.hasOwnProperty.call(reg.customFields, key)) {
                    baseData[key] = reg.customFields[key] || '';
                    headers.add(key); // Dynamically add custom field headers
                }
            }
        }
        
        // Handle cultural event registrations with tickets: create a row for each ticket
        if (event.type === 'culturalEvent' && reg.selectedTickets && reg.selectedTickets.length > 0) {
            reg.selectedTickets.forEach(ticket => {
                flattenedData.push({
                    ...baseData,
                    'Ticket Type': ticket.ticketType || '',
                    'Ticket Quantity': ticket.quantity || '',
                    'Ticket Price': ticket.ticketPrice || '',
                });
            });
        } else {
            // For standard events or cultural events with no tickets selected, add a single row
            // with empty ticket details.
            flattenedData.push({
                ...baseData,
                'Ticket Type': '',
                'Ticket Quantity': '',
                'Ticket Price': '',
            });
        }
    });

    const finalHeaders = Array.from(headers);

    try {
        const json2csvParser = new Parser({ fields: finalHeaders });
        const csv = json2csvParser.parse(flattenedData);

        // 4. Set headers and send the CSV file as a download
        res.header('Content-Type', 'text/csv');
        // Sanitize the event title for the filename
        const safeTitle = event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 50);
        res.attachment(`registrations_${safeTitle}_${eventId}.csv`);
        res.send(csv);
    } catch (error) {
        // This catch block handles synchronous errors from the CSV parser
        console.error('CSV export error:', error);
        res.status(500).json({ message: 'Error generating CSV file.' });
    }
}));

module.exports = router;
