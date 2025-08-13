const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// New sub-schema for event registrations
const registrationSchema = mongoose.Schema({
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true,
    },
    eventName: {
        type: String,
        required: true,
    },
    registeredAt: {
        type: Date,
        default: Date.now,
    }
});

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
    avatar: { 
        type: String, 
        default: null 
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
    registrations: [registrationSchema],
    // ADDED: This is the critical field for tracking which posts a user has liked.
    likedPosts: [{ 
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

module.exports = mongoose.model('User', userSchema);