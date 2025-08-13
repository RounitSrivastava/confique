const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    type: { type: String, enum: ['warning', 'success', 'info', 'report', 'registration', 'like', 'comment'], default: 'info' },
    
    // The recipient field is essential for user-specific notifications
    recipient: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },
    
    // Admin-specific fields for reports
    isRead: { type: Boolean, default: false },
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
    reportReason: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);