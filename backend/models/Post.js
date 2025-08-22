const mongoose = require('mongoose');

// NEW: Sub-schema for storing individual registration data
const registrationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    transactionId: { type: String },
    // Custom fields from the registration form will be stored here
    rollNumber: { type: String }, 
    branch: { type: String },
    semester: { type: String }
}, { _id: false });

// ADDED: The schema for comments. This was missing and caused the error.
const commentSchema = new mongoose.Schema({
    author: { type: String, required: true },
    authorAvatar: { type: String, default: 'https://placehold.co/40x40/cccccc/000000?text=A' },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

const postSchema = new mongoose.Schema({
    type: { type: String, enum: ['confession', 'event', 'news'], required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    images: [{ type: String }],
    author: { type: String, required: true },
    authorAvatar: { type: String, default: 'https://placehold.co/40x40/cccccc/000000?text=A' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    timestamp: { type: Date, default: Date.now },
    likes: { type: Number, default: 0 },
    likedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    comments: { type: Number, default: 0 },
    commentData: [commentSchema],
    
    // Event-specific fields
    status: { type: String, enum: ['pending', 'approved'], default: 'approved' }, // NEW: Post status for approval
    source: { type: String }, // NEW: Source of the event
    location: { type: String },
    eventStartDate: { type: Date },
    eventEndDate: { type: Date },
    price: { type: Number, default: 0 },
    language: { type: String },
    duration: { type: String },
    ticketsNeeded: { type: String },
    venueAddress: { type: String },
    registrationLink: { type: String },
    registrationOpen: { type: Boolean, default: true },
    enableRegistrationForm: { type: Boolean, default: false },
    registrationFields: { type: String },
    paymentMethod: { type: String, enum: ['link', 'qr'] },
    paymentLink: { type: String },
    paymentQRCode: { type: String },

    // Array to store all detailed registrations for this event
    registrations: [registrationSchema],
}, { timestamps: true });

// Pre-save hook to automatically update the comments count
postSchema.pre('save', function(next) {
    if (this.isModified('commentData')) {
        this.comments = this.commentData.length;
    }
    next();
});

module.exports = mongoose.model('Post', postSchema);