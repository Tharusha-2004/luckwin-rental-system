const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');

/**
 * Items Routes
 * Base URL: /api/items
 */

// Get all items
router.get('/', itemController.getAllItems);

// Get low stock items
router.get('/low-stock', itemController.getLowStockItems);

// Get single item by ID
router.get('/:id', itemController.getItemById);

// Create new item
router.post('/', itemController.createItem);

// Update item
router.put('/:id', itemController.updateItem);

// Delete item
router.delete('/:id', itemController.deleteItem);

module.exports = router;
