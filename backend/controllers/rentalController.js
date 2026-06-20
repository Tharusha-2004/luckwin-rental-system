const Rental = require('../models/Rental');
const Item = require('../models/Item');
const Customer = require('../models/Customer');
const { v4: uuidv4 } = require('uuid');
const notificationService = require('../services/notificationService');

/**
 * Rental Controller
 * Handles all rental (transaction) related business logic
 */

// Get all rentals with optional filters
const getAllRentals = async (req, res) => {
  try {
    const { status, customerId } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (customerId) filter.customerId = customerId;

    const rentals = await Rental.find(filter)
      .populate('customerId', 'name phone nic')
      .populate('rentedItems.itemId', 'name dailyRate')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: rentals.length,
      data: rentals,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get single rental by ID
const getRentalById = async (req, res) => {
  try {
    const rental = await Rental.findById(req.params.id)
      .populate('customerId', 'name phone nic')
      .populate('rentedItems.itemId', 'name dailyRate');

    if (!rental) {
      return res.status(404).json({
        success: false,
        error: 'Rental not found',
      });
    }

    res.json({
      success: true,
      data: rental,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Create new rental (POST /rent)
const createRental = async (req, res) => {
  const session = await Rental.startSession();
  session.startTransaction();

  try {
    const { customerId, rentedItems, expectedReturnDate, advancePayment, notes, remarks } = req.body;

    // Validation
    if (!customerId || !rentedItems || !expectedReturnDate) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        error: "Missing required fields. Please check customer, items, and return date.",
      });
    }

    if (!Array.isArray(rentedItems) || rentedItems.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        error: 'rentedItems must be a non-empty array',
      });
    }

    // Verify customer exists
    const customer = await Customer.findById(customerId).session(session);
    if (!customer) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        error: 'Customer not found',
      });
    }

    // Prepare rented items and calculate total cost
    let totalCost = 0;
    const preparedItems = [];
    const expectedReturnMs = new Date(expectedReturnDate).getTime();
    const currentDateMs = new Date().getTime();
    const daysDifference = Math.ceil((expectedReturnMs - currentDateMs) / (1000 * 60 * 60 * 24));

    for (const item of rentedItems) {
      const dbItem = await Item.findById(item.itemId).session(session);
      if (!dbItem) {
        await session.abortTransaction();
        return res.status(404).json({
          success: false,
          error: `Item with ID ${item.itemId} not found`,
        });
      }

      if (item.quantity > dbItem.availableQuantity) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          error: `Not enough stock for ${dbItem.name}. Only ${dbItem.availableQuantity} available.`,
        });
      }

      // Decrease available quantity
      dbItem.availableQuantity -= item.quantity;
      await dbItem.save({ session });

      // Calculate cost for this item: quantity * dailyRate * days
      const itemCost = item.quantity * dbItem.dailyRate * daysDifference;
      totalCost += itemCost;

      preparedItems.push({
        itemId: dbItem._id,
        quantity: item.quantity,
        dailyRate: dbItem.dailyRate,
      });
    }

    // Generate unique agreement token
    const agreementToken = uuidv4();

    // Create rental
    const rental = new Rental({
      customerId,
      rentedItems: preparedItems,
      expectedReturnDate,
      advancePayment: advancePayment || 0,
      totalCost,
      finalAmount: totalCost - (advancePayment || 0),
      status: 'Active',
      agreementToken,
      notes,
      remarks,
    });

    await rental.save({ session });
    await session.commitTransaction();

    // Send notification
    await notificationService.sendDigitalReceipt(customer.phone, agreementToken);

    // Populate response
    const populatedRental = await Rental.findById(rental._id)
      .populate('customerId')
      .populate('rentedItems.itemId');

    res.status(201).json({
      success: true,
      message: 'Rental created successfully',
      data: populatedRental,
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({
      success: false,
      error: error.message || "An unexpected server error occurred.",
    });
  } finally {
    await session.endSession();
  }
};

// Process rental return (POST /return/:id)
const processReturn = async (req, res) => {
  const session = await Rental.startSession();
  session.startTransaction();

  try {
    const rental = await Rental.findById(req.params.id).session(session);

    if (!rental) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        error: 'Rental not found',
      });
    }

    if (rental.status === 'Returned') {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        error: 'Rental has already been returned',
      });
    }

    const actualReturnDate = new Date();
    rental.actualReturnDate = actualReturnDate;

    // Calculate actual days rented
    const rentDateMs = new Date(rental.rentDate).getTime();
    const returnDateMs = actualReturnDate.getTime();
    const actualDays = Math.ceil((returnDateMs - rentDateMs) / (1000 * 60 * 60 * 24));

    // Recalculate total cost based on actual days
    let recalculatedCost = 0;
    for (const item of rental.rentedItems) {
      const dbItem = await Item.findById(item.itemId).session(session);
      recalculatedCost += item.quantity * item.dailyRate * actualDays;

      // Increase available quantity
      dbItem.availableQuantity += item.quantity;
      await dbItem.save({ session });
    }

    rental.totalCost = recalculatedCost;
    rental.discountAmount = req.body.manualDiscount || 0;
    rental.finalAmount = (recalculatedCost - rental.discountAmount) - rental.advancePayment;
    rental.status = 'Returned';

    await rental.save({ session });
    await session.commitTransaction();

    const populatedRental = await Rental.findById(rental._id)
      .populate('customerId')
      .populate('rentedItems.itemId');

    res.json({
      success: true,
      message: 'Rental returned successfully',
      data: populatedRental,
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({
      success: false,
      error: error.message,
    });
  } finally {
    await session.endSession();
  }
};

// Get rental by agreement token (for receipt)
const getRentalByToken = async (req, res) => {
  try {
    const rental = await Rental.findOne({ agreementToken: req.params.token })
      .populate('customerId')
      .populate('rentedItems.itemId');

    if (!rental) {
      return res.status(404).json({
        success: false,
        error: 'Rental not found',
      });
    }

    res.json({
      success: true,
      data: rental,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get active rentals
const getActiveRentals = async (req, res) => {
  try {
    const rentals = await Rental.find({ status: 'Active' })
      .populate('customerId', 'name phone nic')
      .populate('rentedItems.itemId', 'name')
      .sort({ expectedReturnDate: 1 });

    res.json({
      success: true,
      count: rentals.length,
      data: rentals,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get overdue rentals
const getOverdueRentals = async (req, res) => {
  try {
    const now = new Date();
    const rentals = await Rental.find({
      status: 'Active',
      expectedReturnDate: { $lt: now },
    })
      .populate('customerId', 'name phone nic')
      .populate('rentedItems.itemId', 'name')
      .sort({ expectedReturnDate: 1 });

    // Update status to 'Overdue'
    for (const rental of rentals) {
      rental.status = 'Overdue';
      await rental.save();
    }

    res.json({
      success: true,
      count: rentals.length,
      data: rentals,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Search rentals by Agreement Token OR Customer NIC
 * GET /api/rentals/search/:query
 *
 * Priority:
 *  1. Exact match on agreementToken (any status)
 *  2. Customer NIC lookup → return all Active/Overdue rentals for that customer
 */
const searchRentals = async (req, res) => {
  try {
    const query = req.params.query?.trim();

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required.',
      });
    }

    // ── 1. Try exact token match first ──────────────────────────────────────
    const byToken = await Rental.findOne({ agreementToken: query })
      .populate('customerId')
      .populate('rentedItems.itemId');

    if (byToken) {
      return res.json({
        success: true,
        searchType: 'token',
        data: [byToken],
      });
    }

    // ── 2. Fall back: look up customer by NIC ────────────────────────────────
    const customer = await Customer.findOne({ nic: query });

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'No rental or customer found matching that token or NIC.',
      });
    }

    // Return all Active (or Overdue) rentals for this customer
    const byNic = await Rental.find({
      customerId: customer._id,
      status: { $in: ['Active', 'Overdue'] },
    })
      .populate('customerId')
      .populate('rentedItems.itemId')
      .sort({ createdAt: -1 });

    if (byNic.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Customer "${customer.name}" has no active rentals.`,
      });
    }

    return res.json({
      success: true,
      searchType: 'nic',
      data: byNic,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const updateRental = async (req, res) => {
  try {
    const rentalId = req.params.id;
    const { rentedItems, subtotal, advancePaid, remarks } = req.body; // <--- remarks eka add kala
    const existingRental = await Rental.findById(rentalId);
    if (!existingRental) {
      return res.status(404).json({ success: false, error: 'Rental record not found' });
    }

    existingRental.remarks = remarks !== undefined ? remarks : existingRental.remarks; // <--- aluth line eka

    // Restore old item stock
    for (const oldItem of existingRental.rentedItems) {
      const inventoryItem = await Item.findById(oldItem.itemId);
      if (inventoryItem) {
        inventoryItem.availableQuantity += oldItem.quantity;
        await inventoryItem.save();
      }
    }

    // Deduct new item stock
    const preparedItems = [];
    for (const newItem of rentedItems) {
      const inventoryItem = await Item.findById(newItem.itemId || newItem.item);
      if (!inventoryItem) {
        return res.status(404).json({ success: false, error: 'Item not found in inventory' });
      }
      if (inventoryItem.availableQuantity < newItem.quantity) {
        return res.status(400).json({
          success: false,
          error: `Not enough stock for ${inventoryItem.name}. Only ${inventoryItem.availableQuantity} available.`,
        });

      }
      inventoryItem.availableQuantity -= newItem.quantity;
      await inventoryItem.save();

      preparedItems.push({
        itemId: inventoryItem._id,
        quantity: newItem.quantity,
        dailyRate: inventoryItem.dailyRate,
      });
    }

    existingRental.rentedItems = preparedItems;
    existingRental.totalCost = subtotal;
    existingRental.advancePayment = advancePaid !== undefined ? advancePaid : existingRental.advancePayment;
    existingRental.finalAmount = existingRental.totalCost - existingRental.advancePayment;

    const updatedRental = await existingRental.save();

    const populated = await Rental.findById(updatedRental._id)
      .populate('customerId', 'name phone nic')
      .populate('rentedItems.itemId', 'name dailyRate');

    res.status(200).json({
      success: true,
      message: 'Rental updated successfully',
      data: populated,
    });
  } catch (error) {
    console.error('Error updating rental:', error);
    res.status(500).json({ success: false, error: 'Server error while updating rental' });
  }
};

// Delete rental
const deleteRental = async (req, res) => {
  try {
    const rental = await Rental.findByIdAndDelete(req.params.id);
    if (!rental) {
      return res.status(404).json({ success: false, error: 'Rental not found' });
    }
    res.json({ success: true, message: 'Rental deleted successfully' });
  } catch (error) {
    console.error('Error deleting rental:', error);
    res.status(500).json({ success: false, error: 'Server error while deleting rental' });
  }
};

module.exports = {
  getAllRentals,
  getRentalById,
  createRental,
  processReturn,
  getRentalByToken,
  getActiveRentals,
  getOverdueRentals,
  searchRentals,
  updateRental,
  deleteRental,
};