const express = require('express');
const router = express.Router();
const rentalController = require('../controllers/rentalController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * Rentals Routes
 * Base URL: /api/rentals
 * All routes are protected — requires a valid Bearer token.
 */

// Apply auth to every route in this file
router.use(authMiddleware);

// Get all rentals (with optional filters)
router.get('/', rentalController.getAllRentals);

// Get active rentals
router.get('/active', rentalController.getActiveRentals);

// Get overdue rentals
router.get('/overdue', rentalController.getOverdueRentals);

// Get rental by agreement token (for receipt)
router.get('/token/:token', rentalController.getRentalByToken);

// Search rental by Agreement Token OR Customer NIC (must be before /:id)
router.get('/search/:query', rentalController.searchRentals);

// Get single rental by ID
router.get('/:id', rentalController.getRentalById);

// Create new rental
router.post('/', rentalController.createRental);

// Process rental return
router.post('/:id/return', rentalController.processReturn);

module.exports = router;
