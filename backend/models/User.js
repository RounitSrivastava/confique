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