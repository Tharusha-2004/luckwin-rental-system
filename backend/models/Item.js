const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
    },
    description: {
      type: String,
      trim: true,
    },
    dailyRate: {
      type: Number,
      required: true,
      min: 0,
    },
    totalQuantity: {
      type: Number,
      required: true,
      min: 0,
    },
    availableQuantity: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      enum: ['Power Tools', 'Hand Tools', 'Heavy machinery', 'Other'],
      default: 'Other',
    },
    unit: {
      type: String,
      default: 'unit',
      // e.g., 'boards', 'pieces', 'sets', etc.
    },
    imageUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster lookups
itemSchema.index({ name: 1 });

module.exports = mongoose.model('Item', itemSchema);
