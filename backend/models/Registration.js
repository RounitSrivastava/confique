// const mongoose = require('mongoose');

// const registrationSchema = mongoose.Schema({
//     eventId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Post',
//         required: true,
//     },
//     userId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'User',
//         required: true,
//     },
//     name: {
//         type: String,
//         required: true,
//     },
//     email: {
//         type: String,
//         required: true,
//     },
//     phone: {
//         type: String,
//         required: true,
//     },
//     customFields: {
//         type: Object,
//         default: {}
//     },
//     createdAt: {
//         type: Date,
//         default: Date.now,
//     }
// }, {
//     timestamps: true
// });

// module.exports = mongoose.model('Registration', registrationSchema);

const mongoose = require('mongoose');

const registrationSchema = mongoose.Schema({
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
    },
    // The transaction ID field is useful for both types of paid events
    transactionId: {
        type: String,
    },
    // NEW: Cultural event specific fields are now added here
    bookingDates: [{
        type: String,
    }],
    selectedTickets: [{
        ticketType: { type: String },
        ticketPrice: { type: Number },
        quantity: { type: Number },
    }],
    totalPrice: {
        type: Number,
    },
    // FIXED: Use Mixed type for dynamic custom fields
    customFields: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Registration', registrationSchema);