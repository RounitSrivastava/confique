// old
const mongoose = require('mongoose');

// Sub-schema for cultural event ticket options
const ticketOptionSchema = new mongoose.Schema({
    ticketType: { type: String, required: true },
    ticketPrice: { type: Number, required: true, min: 0 },
}, { _id: false });

// Sub-schema for comments
const commentSchema = new mongoose.Schema({
    author: { type: String, required: true },
    authorAvatar: { type: String, default: 'https://placehold.co/40x40/cccccc/000000?text=A' },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

// A separate schema for Registrations (not embedded in Post)
const registrationSchema = new mongoose.Schema({
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    transactionId: { type: String },
    paymentScreenshot: { type: String }, // Stores the Cloudinary URL of the payment screenshot
    customFields: { type: mongoose.Schema.Types.Mixed, default: {} },
    bookingDates: [{ type: String }],
    selectedTickets: [{
        ticketType: { type: String },
        ticketPrice: { type: Number },
        quantity: { type: Number },
    }],
    totalPrice: { type: Number },
    paymentStatus: {
        type: String,
        enum: ['pending', 'under_review', 'confirmed', 'rejected'],
        default: 'pending'
    }
}, { timestamps: true });

// Main Post Schema
const postSchema = new mongoose.Schema({
    // General Post Fields (applicable to all types)
    type: {
        type: String,
        required: true,
        enum: ['confession', 'event', 'culturalEvent', 'news'],
    },
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

    // Event-specific Fields
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
    source: { type: String },
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

    // Cultural Event-specific Fields
    ticketOptions: [ticketOptionSchema],
    culturalPaymentMethod: { type: String, enum: ['link', 'qr', 'qr-screenshot'] },
    culturalPaymentLink: { type: String },
    culturalPaymentQRCode: { type: String },
    availableDates: [{ type: String }],
}, { timestamps: true });

// Pre-save hook to automatically update the comments count
postSchema.pre('save', function(next) {
    if (this.isModified('commentData')) {
        this.comments = this.commentData.length;
    }
    next();
});

const PostModel = mongoose.model('Post', postSchema);
const RegistrationModel = mongoose.model('Registration', registrationSchema);

module.exports = {
    Post: PostModel,
    Registration: RegistrationModel,
};