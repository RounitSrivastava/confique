const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    type: { 
        type: String, 
        enum: [
            'warning', 'success', 'info', 'report', 'registration', 'like', 'comment',
            // ADD THESE SHOWCASE TYPES:
            'showcase_upvote', 'showcase_comment', 'showcase_featured', 'showcase_approved', 'showcase_system'
        ], 
        default: 'info' 
    },
    
    recipient: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },
    
    isRead: { type: Boolean, default: false },
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
    reportReason: { type: String },

    // ADD THESE 3 FIELDS FOR SHOWCASE:
    relatedUser: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },
    relatedPost: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Post' 
    },
    readAt: { 
        type: Date 
    }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);