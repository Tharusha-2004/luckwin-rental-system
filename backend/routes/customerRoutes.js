const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * Customers Routes
 * Base URL: /api/customers
 * All routes are protected — requires a valid Bearer token.
 */

// Apply auth to every route in this file
router.use(authMiddleware);

// Get all customers
router.get('/', customerController.getAllCustomers);

// Search customers
router.get('/search', customerController.searchCustomers);

// Get customer rental history
router.get('/:id/history', customerController.getCustomerHistory);

// Get single customer by ID
router.get('/:id', customerController.getCustomerById);

// Create new customer
router.post('/', customerController.createCustomer);

// Update customer
router.put('/:id', customerController.updateCustomer);

// Delete customer
router.delete('/:id', customerController.deleteCustomer);

module.exports = router;
