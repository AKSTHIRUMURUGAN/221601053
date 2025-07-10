const mongoose = require('mongoose');

const clickSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  referrer: String,
  location: String, 
});

const shortURLSchema = new mongoose.Schema({
  originalURL: { type: String, required: true },
  shortcode: { type: String, required: true, unique: true },
  expiryDate: { type: Date, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  clicks: [clickSchema],
}, { timestamps: true });

module.exports = mongoose.model('ShortURL', shortURLSchema);
