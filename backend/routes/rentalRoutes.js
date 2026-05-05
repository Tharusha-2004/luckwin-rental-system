const express = require('express');
const router = express.Router();
const rentalController = require('../controllers/rentalController');

/**
 * Rentals Routes
 * Base URL: /api/rentals
 */

// Get all rentals (with optional filters)
router.get('/', rentalController.getAllRentals);

// Get active rentals
router.get('/active', rentalController.getActiveRentals);

// Get overdue rentals
router.get('/overdue', rentalController.getOverdueRentals);

// Get rental by agreement token (for receipt)
router.get('/token/:token', rentalController.getRentalByToken);

// Get single rental by ID
router.get('/:id', rentalController.getRentalById);

// Create new rental
router.post('/', rentalController.createRental);

// Process rental return
router.post('/:id/return', rentalController.processReturn);

module.exports = router;
