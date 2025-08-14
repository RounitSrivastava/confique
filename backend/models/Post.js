const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    author: { type: String, required: true },
    authorAvatar: { type: String, default: 'https://placehold.co/40x40/cccccc/000000?text=A' },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

const postSchema = new mongoose.Schema({
    type: { type: String, enum: ['consights', 'event', 'news'], required: true },
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

    // ADDED: This field tracks who has registered for an event
    registeredUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
}, { timestamps: true });

// ADDED: Pre-save hook to automatically update the comments count
postSchema.pre('save', function(next) {
    if (this.isModified('commentData')) {
        this.comments = this.commentData.length;
    }
    next();
});

module.exports = mongoose.model('Post', postSchema);