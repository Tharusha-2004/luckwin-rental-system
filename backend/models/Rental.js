const mongoose = require('mongoose');

const rentalSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    rentedItems: [
      {
        itemId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Item',
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        dailyRate: {
          type: Number,
          required: true,
          min: 0,
        },
        _id: false, // Prevent _id for subdocuments
      },
    ],
    rentDate: {
      type: Date,
      default: Date.now,
    },
    expectedReturnDate: {
      type: Date,
      required: true,
    },
    actualReturnDate: {
      type: Date,
    },
    advancePayment: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    totalCost: {
      type: Number,
      min: 0,
    },
    finalAmount: {
      type: Number,
      // Final amount due = totalCost - advancePayment
    },
    status: {
      type: String,
      enum: ['Active', 'Returned', 'Overdue'],
      default: 'Active',
    },
    agreementToken: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster lookups and to prevent duplicate tokens
rentalSchema.index({ agreementToken: 1 });
rentalSchema.index({ customerId: 1 });
rentalSchema.index({ status: 1 });

module.exports = mongoose.model('Rental', rentalSchema);
