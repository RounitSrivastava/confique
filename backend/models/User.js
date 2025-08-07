const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, sparse: true }, // Make password optional for Google users
  avatar: { type: String, default: null },
  isAdmin: { type: Boolean, default: false },
  googleId: { type: String, unique: true, sparse: true }, // New field for Google ID
  registrations: [{
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
    eventName: String,
    registeredAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

// Pre-save hook for password hashing (only if password is provided/modified)
userSchema.pre('save', async function(next) {
  if (this.isModified('password') && this.password) { // Only hash if password exists and is modified
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  if (!this.password) return false; // No password to match if it's a Google-only user
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);