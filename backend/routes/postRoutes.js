// Add these new imports at the top of the file
const { Parser } = require('json2csv');
const Registration = require('../models/Registration'); 

// ... (existing imports like express, protect, admin middleware, etc.)

// NEW ROUTE: GET /api/posts/export-registrations/:eventId
// This route generates and serves a CSV file of registrations.
router.get('/export-registrations/:eventId', protect, async (req, res) => {
    const { eventId } = req.params;

    // 1. Verify the user is the host of the event
    const event = await Post.findById(eventId);
    if (!event) {
        return res.status(404).json({ message: 'Event not found.' });
    }
    if (event.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to export this data.' });
    }

    // 2. Fetch all registration data for the event
    const registrations = await Registration.find({ eventId });
    if (registrations.length === 0) {
        return res.status(404).json({ message: 'No registrations found for this event.' });
    }

    // 3. Flatten the data and add headers for CSV
    // Get all unique custom fields from registrations
    let customFieldsSet = new Set();
    registrations.forEach(reg => {
        Object.keys(reg.customFields).forEach(field => customFieldsSet.add(field));
    });
    const customFields = [...customFieldsSet];

    const fields = ['Name', 'Email', 'Phone', ...customFields, 'Registered At'];

    const data = registrations.map(reg => {
        const row = {
            'Name': reg.name,
            'Email': reg.email,
            'Phone': reg.phone,
            'Registered At': reg.createdAt.toISOString(),
        };
        // Add custom fields
        for (const field of customFields) {
            row[field] = reg.customFields[field] || '';
        }
        return row;
    });

    try {
        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(data);

        // 4. Set headers and send the CSV file as a download
        res.header('Content-Type', 'text/csv');
        res.attachment(`registrations_${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv`);
        res.send(csv);
    } catch (error) {
        console.error('CSV export error:', error);
        res.status(500).json({ message: 'Error generating CSV file.' });
    }
});

// ... (other existing routes in postRoutes.js)

module.exports = router;