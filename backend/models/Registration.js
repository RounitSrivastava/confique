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
    // FIX: Made the phone field optional for cultural events
    phone: {
        type: String,
    },
    // NEW: Cultural event specific fields are added here
    ticketType: {
        type: String,
    },
    ticketQuantity: {
        type: Number,
    },
    totalPrice: {
        type: Number,
    },
    // The transaction ID field is useful for both types of paid events
    transactionId: {
        type: String,
    },
    // General custom fields for standard events
    customFields: {
        type: Object,
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