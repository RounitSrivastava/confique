const mongoose = require('mongoose');

// Sub-schema for cultural event ticket options
const ticketOptionSchema = new mongoose.Schema({
    ticketType: { type: String, required: true },
    ticketPrice: { type: Number, required: true, min: 0 },
}, { _id: false });

// Sub-schema for comments (for confession/event posts)
const commentSchema = new mongoose.Schema({
    author: { type: String, required: true },
    authorAvatar: { type: String, default: 'https://placehold.co/40x40/cccccc/000000?text=A' },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

// Sub-schema for showcase comments (different structure)
const showcaseCommentSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    text: { 
        type: String, 
        required: true 
    },
    timestamp: { 
        type: String, 
        required: true 
    },
    author: { 
        type: String 
    },
    authorAvatar: { 
        type: String 
    }
}, { _id: true });

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
        enum: ['confession', 'event', 'culturalEvent', 'news', 'showcase'], // ADDED 'showcase'
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

    // ==============================================
    // NEW STARTUP SHOWCASE FIELDS
    // ==============================================
    
    // Basic showcase fields
    description: { 
        type: String 
    }, // Short description for cards
    fullDescription: { 
        type: String 
    }, // Detailed description for showcase page
    websiteLink: { 
        type: String 
    }, // Startup website URL
    
    // Visual assets
    logoUrl: { 
        type: String 
    }, // Startup logo image URL
    bannerUrl: { 
        type: String 
    }, // Banner image URL for showcase page
    
    // Showcase-specific metadata
    month: { 
        type: String 
    }, // e.g., "October '25" for filtering
    launchedDate: { 
        type: String 
    }, // Date when launched/created
    
    // Engagement metrics
    upvotes: { 
        type: Number, 
        default: 0 
    }, // Separate from likes for showcase
    upvoters: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }], // Users who upvoted this showcase
    
    // Showcase comments (different from regular comments)
    showcaseComments: [showcaseCommentSchema],
    commentCount: { 
        type: Number, 
        default: 0 
    }, // Separate count for showcase comments

}, { timestamps: true });

// Pre-save hook to automatically update the comments count
postSchema.pre('save', function(next) {
    if (this.isModified('commentData')) {
        this.comments = this.commentData.length;
    }
    
    // NEW: Update showcase comment count
    if (this.isModified('showcaseComments')) {
        this.commentCount = this.showcaseComments.length;
    }
    
    next();
});

// Indexes for better showcase performance
postSchema.index({ type: 1, month: 1, status: 1 }); // For showcase filtering
postSchema.index({ type: 1, upvotes: -1 }); // For showcase sorting by popularity
postSchema.index({ type: 1, createdAt: -1 }); // For showcase sorting by newest

const PostModel = mongoose.model('Post', postSchema);
const RegistrationModel = mongoose.model('Registration', registrationSchema);

module.exports = {
    Post: PostModel,
    Registration: RegistrationModel,
};