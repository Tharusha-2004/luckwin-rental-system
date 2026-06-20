const express = require('express');
const router = express.Router();
const Rental = require('../models/Rental');

/**
 * Receipt API Routes
 * Base URL: /api/receipt
 * Public endpoint for accessing rental receipts via unique token
 */

// Get receipt by token
router.get('/:token', async (req, res) => {
  try {
    const rental = await Rental.findOne({ agreementToken: req.params.token })
      .populate('customerId')
      .populate('rentedItems.itemId');

    if (!rental) {
      return res.status(404).json({
        success: false,
        error: 'Receipt not found',
      });
    }

    // Calculate days rented
    let daysDaysRented;
    if (rental.actualReturnDate) {
      const rentDateMs = new Date(rental.rentDate).getTime();
      const returnDateMs = new Date(rental.actualReturnDate).getTime();
      daysDaysRented = Math.ceil((returnDateMs - rentDateMs) / (1000 * 60 * 60 * 24));
    } else {
      const rentDateMs = new Date(rental.rentDate).getTime();
      const expectedMs = new Date(rental.expectedReturnDate).getTime();
      daysDaysRented = Math.ceil((expectedMs - rentDateMs) / (1000 * 60 * 60 * 24));
    }

    // Format response
    const receiptData = {
      success: true,
      data: {
        agreementToken: rental.agreementToken,
        status: rental.status,
        customer: {
          name: rental.customerId.name,
          phone: rental.customerId.phone,
          nic: rental.customerId.nic,
          address: rental.customerId.address,
          companyName: rental.customerId.companyName,
        },
        rentedItems: rental.rentedItems.map((item) => ({
          name: item.itemId.name,
          quantity: item.quantity,
          dailyRate: item.dailyRate,
          totalItemCost: item.quantity * item.dailyRate * daysDaysRented,
        })),
        rentDate: rental.rentDate,
        expectedReturnDate: rental.expectedReturnDate,
        actualReturnDate: rental.actualReturnDate,
        daysDaysRented,
        advancePayment: rental.advancePayment,
        totalCost: rental.totalCost,
        finalAmount: rental.finalAmount,
        remarks: rental.remarks,
      },
    };

    res.json(receiptData);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;