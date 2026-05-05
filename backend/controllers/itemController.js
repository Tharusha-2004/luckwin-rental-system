const Item = require('../models/Item');

/**
 * Item Controller
 * Handles all item-related business logic
 */

// Get all items
const getAllItems = async (req, res) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      count: items.length,
      data: items,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get single item by ID
const getItemById = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Item not found',
      });
    }
    res.json({
      success: true,
      data: item,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Create new item
const createItem = async (req, res) => {
  try {
    const { name, description, dailyRate, totalQuantity, category, unit, imageUrl } = req.body;

    // Validation
    if (!name || dailyRate === undefined || totalQuantity === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, dailyRate, totalQuantity',
      });
    }

    if (dailyRate < 0 || totalQuantity < 0) {
      return res.status(400).json({
        success: false,
        error: 'Daily rate and total quantity must be non-negative',
      });
    }

    const item = new Item({
      name,
      description,
      dailyRate,
      totalQuantity,
      availableQuantity: totalQuantity,
      category,
      unit,
      imageUrl,
    });

    await item.save();

    res.status(201).json({
      success: true,
      message: 'Item created successfully',
      data: item,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Item name already exists',
      });
    }
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Update item
const updateItem = async (req, res) => {
  try {
    const { name, description, dailyRate, totalQuantity, category, unit, imageUrl } = req.body;

    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Item not found',
      });
    }

    // Update fields if provided
    if (name !== undefined) item.name = name;
    if (description !== undefined) item.description = description;
    if (dailyRate !== undefined) item.dailyRate = dailyRate;
    if (totalQuantity !== undefined) {
      // Update total quantity and adjust available quantity
      const difference = totalQuantity - item.totalQuantity;
      item.totalQuantity = totalQuantity;
      item.availableQuantity = Math.max(0, item.availableQuantity + difference);
    }
    if (category !== undefined) item.category = category;
    if (unit !== undefined) item.unit = unit;
    if (imageUrl !== undefined) item.imageUrl = imageUrl;

    await item.save();

    res.json({
      success: true,
      message: 'Item updated successfully',
      data: item,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Item name already exists',
      });
    }
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Delete item - Check if item is in active rentals
const deleteItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Item not found',
      });
    }

    // Check if item is part of any active rental
    const Rental = require('../models/Rental');
    const activeRental = await Rental.findOne({
      'rentedItems.itemId': req.params.id,
      status: { $in: ['Active', 'Overdue'] },
    });

    if (activeRental) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete item. It is currently part of an active rental.',
      });
    }

    await Item.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Item deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get low stock items (available quantity < 10% of total)
const getLowStockItems = async (req, res) => {
  try {
    const items = await Item.find();
    const lowStockItems = items.filter(
      (item) => item.availableQuantity < item.totalQuantity * 0.1
    );

    res.json({
      success: true,
      count: lowStockItems.length,
      data: lowStockItems,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

module.exports = {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  getLowStockItems,
};
