const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// New sub-schema for avatar to align with the new backend logic
const avatarSchema = new mongoose.Schema({
    url: { type: String, required: true },
    publicId: { type: String, required: true }
}, { _id: false });

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: {
        type: String,
        required: true,
        unique: true,
        sparse: true
    },
    password: {
        type: String,
        sparse: true
    },
    phone: {
        type: String,
        sparse: true,
        default: null
    },
    // FIX: Change avatar type to use the new schema
    avatar: {
        type: avatarSchema,
        default: {
            url: 'https://placehold.co/40x40/cccccc/000000?text=A',
            publicId: 'default_avatar'
        }
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },

    // ==============================================
    // NEW STARTUP SHOWCASE FIELDS
    // ==============================================
    
    // User profile enhancements for showcase
    bio: { 
        type: String,
        maxlength: 500 
    },
    website: { 
        type: String 
    },
    linkedin: { 
        type: String 
    },
    twitter: { 
        type: String 
    },
    
    // Showcase engagement tracking
    upvotedPosts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    }],
    bookmarkedPosts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    }],

}, {
    timestamps: true,
    collation: { locale: 'en', strength: 2 }
});

// Pre-save hook for password hashing (only if password is provided/modified)
userSchema.pre('save', async function(next) {
    if (this.isModified('password') && this.password) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
});

userSchema.methods.matchPassword = async function(enteredPassword) {
    if (!this.password) return false;
    return await bcrypt.compare(enteredPassword, this.password);
};

// ==============================================
// NEW METHODS FOR STARTUP SHOWCASE
// ==============================================

// Add upvoted post
userSchema.methods.addUpvotedPost = function(postId) {
    if (!this.upvotedPosts.includes(postId)) {
        this.upvotedPosts.push(postId);
        return this.save();
    }
    return Promise.resolve(this);
};

// Remove upvoted post
userSchema.methods.removeUpvotedPost = function(postId) {
    this.upvotedPosts = this.upvotedPosts.filter(
        id => id.toString() !== postId.toString()
    );
    return this.save();
};

// Add bookmarked post
userSchema.methods.addBookmarkedPost = function(postId) {
    if (!this.bookmarkedPosts.includes(postId)) {
        this.bookmarkedPosts.push(postId);
        return this.save();
    }
    return Promise.resolve(this);
};

// Remove bookmarked post
userSchema.methods.removeBookmarkedPost = function(postId) {
    this.bookmarkedPosts = this.bookmarkedPosts.filter(
        id => id.toString() !== postId.toString()
    );
    return this.save();
};

// Check if user has upvoted a post
userSchema.methods.hasUpvoted = function(postId) {
    return this.upvotedPosts.includes(postId);
};

// Check if user has bookmarked a post
userSchema.methods.hasBookmarked = function(postId) {
    return this.bookmarkedPosts.includes(postId);
};

// Get user's showcase statistics
userSchema.methods.getShowcaseStats = async function() {
    const Post = mongoose.model('Post');
    
    const [
        postsCreated,
        totalUpvotesReceived,
        totalCommentsReceived
    ] = await Promise.all([
        Post.countDocuments({ userId: this._id, type: 'showcase' }),
        Post.aggregate([
            { $match: { userId: this._id, type: 'showcase' } },
            { $group: { _id: null, total: { $sum: '$upvotes' } } }
        ]),
        Post.aggregate([
            { $match: { userId: this._id, type: 'showcase' } },
            { $group: { _id: null, total: { $sum: '$commentCount' } } }
        ])
    ]);

    return {
        postsCreated,
        totalUpvotesReceived: totalUpvotesReceived[0]?.total || 0,
        totalCommentsReceived: totalCommentsReceived[0]?.total || 0,
        postsUpvoted: this.upvotedPosts.length,
        postsBookmarked: this.bookmarkedPosts.length
    };
};

// Indexes for better showcase performance
userSchema.index({ upvotedPosts: 1 });
userSchema.index({ bookmarkedPosts: 1 });

module.exports = mongoose.model('User', userSchema);