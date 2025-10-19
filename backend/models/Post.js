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
        required: true,
        maxlength: 1000,
        trim: true
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
}, { _id: true, timestamps: true });

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
        enum: ['confession', 'event', 'culturalEvent', 'news', 'showcase'],
    },
    title: { 
        type: String, 
        required: true,
        trim: true,
        maxlength: 100
    },
    content: { 
        type: String, 
        required: true,
        trim: true
    },
    images: [{ type: String }],
    author: { 
        type: String, 
        required: true,
        trim: true
    },
    authorAvatar: { 
        type: String, 
        default: 'https://placehold.co/40x40/cccccc/000000?text=A' 
    },
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    timestamp: { 
        type: Date, 
        default: Date.now 
    },
    likes: { 
        type: Number, 
        default: 0 
    },
    likedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    comments: { 
        type: Number, 
        default: 0 
    },
    commentData: [commentSchema],

    // Event-specific Fields
    status: { 
        type: String, 
        enum: ['pending', 'approved', 'rejected'], 
        default: 'approved' 
    },
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
        type: String,
        maxlength: 200,
        trim: true
    }, // Short description for cards
    fullDescription: { 
        type: String,
        maxlength: 5000,
        trim: true
    }, // Detailed description for showcase page
    websiteLink: { 
        type: String,
        trim: true,
        validate: {
            validator: function(url) {
                if (!url) return true; // Optional field
                try {
                    new URL(url);
                    return true;
                } catch {
                    return false;
                }
            },
            message: 'Please provide a valid website URL'
        }
    }, // Startup website URL
    
    // Visual assets
    logoUrl: { 
        type: String,
        required: function() {
            return this.type === 'showcase';
        }
    }, // Startup logo image URL (required for showcase)
    bannerUrl: { 
        type: String,
        required: function() {
            return this.type === 'showcase';
        }
    }, // Banner image URL for showcase page (required for showcase)
    
    // Showcase-specific metadata
    month: { 
        type: String,
        required: function() {
            return this.type === 'showcase';
        }
    }, // e.g., "October '25" for filtering (required for showcase)
    launchedDate: { 
        type: String,
        trim: true
    }, // Date when launched/created
    
    // Engagement metrics
    upvotes: { 
        type: Number, 
        default: 0,
        min: 0
    }, // Separate from likes for showcase
    upvoters: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }], // Users who upvoted this showcase
    
    // Showcase comments (different from regular comments)
    showcaseComments: [showcaseCommentSchema],
    commentCount: { 
        type: Number, 
        default: 0,
        min: 0
    }, // Separate count for showcase comments

    // Showcase analytics
    views: {
        type: Number,
        default: 0
    }, // Track how many times the showcase was viewed

}, { 
    timestamps: true,
    toJSON: {
        transform: function(doc, ret) {
            // Add virtual fields when converting to JSON
            ret.isShowcase = ret.type === 'showcase';
            return ret;
        }
    }
});

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

// Virtual for checking if post is a showcase
postSchema.virtual('isShowcase').get(function() {
    return this.type === 'showcase';
});

// Virtual for formatted launch date
postSchema.virtual('formattedLaunchDate').get(function() {
    if (!this.launchedDate) return 'Coming Soon';
    return this.launchedDate;
});

// ==============================================
// NEW METHODS FOR STARTUP SHOWCASE
// ==============================================

// Add upvote to showcase
postSchema.methods.addUpvote = function(userId) {
    if (!this.upvoters.includes(userId)) {
        this.upvoters.push(userId);
        this.upvotes += 1;
        return this.save();
    }
    return Promise.resolve(this);
};

// Remove upvote from showcase
postSchema.methods.removeUpvote = function(userId) {
    const userIndex = this.upvoters.indexOf(userId);
    if (userIndex > -1) {
        this.upvoters.splice(userIndex, 1);
        this.upvotes = Math.max(0, this.upvotes - 1);
        return this.save();
    }
    return Promise.resolve(this);
};

// Add showcase comment
postSchema.methods.addShowcaseComment = function(commentData) {
    this.showcaseComments.push(commentData);
    this.commentCount += 1;
    return this.save();
};

// Remove showcase comment
postSchema.methods.removeShowcaseComment = function(commentId) {
    const commentIndex = this.showcaseComments.findIndex(
        comment => comment._id.toString() === commentId.toString()
    );
    if (commentIndex > -1) {
        this.showcaseComments.splice(commentIndex, 1);
        this.commentCount = Math.max(0, this.commentCount - 1);
        return this.save();
    }
    return Promise.resolve(this);
};

// Increment view count
postSchema.methods.incrementViews = function() {
    this.views += 1;
    return this.save();
};

// Get showcase statistics
postSchema.methods.getShowcaseStats = function() {
    if (this.type !== 'showcase') {
        return null;
    }
    
    return {
        upvotes: this.upvotes,
        comments: this.commentCount,
        views: this.views,
        engagementRate: this.views > 0 ? ((this.upvotes + this.commentCount) / this.views * 100).toFixed(2) : 0
    };
};

// Static method to find top showcase posts
postSchema.statics.findTopShowcases = function(limit = 10, month = null) {
    const matchStage = { type: 'showcase', status: 'approved' };
    if (month) {
        matchStage.month = month;
    }
    
    return this.aggregate([
        { $match: matchStage },
        { $sort: { upvotes: -1, commentCount: -1 } },
        { $limit: limit },
        {
            $project: {
                title: 1,
                description: 1,
                logoUrl: 1,
                upvotes: 1,
                commentCount: 1,
                views: 1,
                month: 1,
                launchedDate: 1,
                author: 1,
                authorAvatar: 1
            }
        }
    ]);
};

// Static method to find showcases by month
postSchema.statics.findShowcasesByMonth = function(month) {
    return this.find({ 
        type: 'showcase', 
        month: month,
        status: 'approved' 
    })
    .sort({ upvotes: -1, createdAt: -1 })
    .populate('upvoters', 'name avatar')
    .populate('showcaseComments.user', 'name avatar');
};

// Static method to get showcase analytics
postSchema.statics.getShowcaseAnalytics = function(month = null) {
    const matchStage = { type: 'showcase', status: 'approved' };
    if (month) {
        matchStage.month = month;
    }
    
    return this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: null,
                totalShowcases: { $sum: 1 },
                totalUpvotes: { $sum: '$upvotes' },
                totalComments: { $sum: '$commentCount' },
                totalViews: { $sum: '$views' },
                averageUpvotes: { $avg: '$upvotes' },
                averageComments: { $avg: '$commentCount' }
            }
        }
    ]);
};

// Indexes for better showcase performance
postSchema.index({ type: 1, month: 1, status: 1 }); // For showcase filtering
postSchema.index({ type: 1, upvotes: -1 }); // For showcase sorting by popularity
postSchema.index({ type: 1, createdAt: -1 }); // For showcase sorting by newest
postSchema.index({ type: 1, userId: 1 }); // For finding user's showcases
postSchema.index({ type: 1, 'showcaseComments.timestamp': -1 }); // For comment sorting
postSchema.index({ type: 1, views: -1 }); // For most viewed showcases

const PostModel = mongoose.model('Post', postSchema);
const RegistrationModel = mongoose.model('Registration', registrationSchema);

module.exports = {
    Post: PostModel,
    Registration: RegistrationModel,
};