const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    nic: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    nicImageUrl: {
      type: String,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    address: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    companyName: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    photo: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster lookups
customerSchema.index({ phone: 1 });
customerSchema.index({ nic: 1 });

module.exports = mongoose.model('Customer', customerSchema);
