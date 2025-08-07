const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  author: { type: String, required: true },
  authorAvatar: { type: String },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const postSchema = new mongoose.Schema({
  type: { type: String, enum: ['confession', 'event', 'news'], required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  images: [{ type: String }],
  author: { type: String, required: true },
  authorAvatar: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  timestamp: { type: Date, default: Date.now },
  likes: { type: Number, default: 0 },
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
}, { timestamps: true });

module.exports = mongoose.model('Post', postSchema);