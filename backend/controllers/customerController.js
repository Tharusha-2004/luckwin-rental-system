const Customer = require('../models/Customer');

/**
 * Customer Controller
 * Handles all customer-related business logic
 */

// Get all customers
const getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      count: customers.length,
      data: customers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get single customer by ID
const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found',
      });
    }
    res.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get customer rental history
const getCustomerHistory = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found',
      });
    }

    const Rental = require('../models/Rental');
    const rentals = await Rental.find({ customerId: req.params.id })
      .populate('rentedItems.itemId')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      customer,
      rentals,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Find-or-Create customer
// If a customer with the same phone OR nic already exists, update their name/nic
// and return 200. Otherwise create a fresh record and return 201.
// Either way the response always contains `customer` so the frontend can
// consistently read `response.data.customer._id`.
const createCustomer = async (req, res) => {
  try {
    const { name, phone, nic, nicImageUrl, email, address, city, companyName, notes } = req.body;

    // ── Validation ────────────────────────────────────────────────────────────
    if (!name || !phone || !nic) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, phone, nic',
      });
    }

    // ── Look for an existing customer matching phone OR nic ───────────────────
    const existing = await Customer.findOne({
      $or: [{ phone: phone.trim() }, { nic: nic.trim() }],
    });

    if (existing) {
      // Update mutable fields in case they changed since last visit
      existing.name = name.trim();
      existing.nic  = nic.trim();
      if (nicImageUrl  !== undefined) existing.nicImageUrl  = nicImageUrl;
      if (email        !== undefined) existing.email        = email;
      if (address      !== undefined) existing.address      = address;
      if (city         !== undefined) existing.city         = city;
      if (companyName  !== undefined) existing.companyName  = companyName;
      if (notes        !== undefined) existing.notes        = notes;

      await existing.save();

      return res.status(200).json({
        success:  true,
        found:    true,
        message:  'Existing customer found and updated',
        customer: existing,   // consistent key for frontend
        data:     existing,   // kept for backward-compat
      });
    }

    // ── No match — create a new customer ─────────────────────────────────────
    const customer = new Customer({
      name: name.trim(),
      phone: phone.trim(),
      nic: nic.trim(),
      nicImageUrl,
      email,
      address,
      city,
      companyName,
      notes,
    });

    await customer.save();

    return res.status(201).json({
      success:  true,
      found:    false,
      message:  'Customer created successfully',
      customer,   // consistent key for frontend
      data:     customer,   // kept for backward-compat
    });

  } catch (error) {
    // Edge-case: race condition where two concurrent requests both pass the
    // findOne check — handle the resulting duplicate-key error gracefully.
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern)[0];
      try {
        const recovered = await Customer.findOne({ [duplicateField]: req.body[duplicateField]?.trim() });
        if (recovered) {
          return res.status(200).json({
            success:  true,
            found:    true,
            message:  'Existing customer found (race-condition recovery)',
            customer: recovered,
            data:     recovered,
          });
        }
      } catch (_) { /* fall through to generic error */ }
    }
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Update customer
const updateCustomer = async (req, res) => {
  try {
    const { name, phone, nic, nicImageUrl, email, address, city, companyName, notes } = req.body;

    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found',
      });
    }

    // Update fields if provided
    if (name !== undefined) customer.name = name;
    if (phone !== undefined) customer.phone = phone;
    if (nic !== undefined) customer.nic = nic;
    if (nicImageUrl !== undefined) customer.nicImageUrl = nicImageUrl;
    if (email !== undefined) customer.email = email;
    if (address !== undefined) customer.address = address;
    if (city !== undefined) customer.city = city;
    if (companyName !== undefined) customer.companyName = companyName;
    if (notes !== undefined) customer.notes = notes;

    await customer.save();

    res.json({
      success: true,
      message: 'Customer updated successfully',
      data: customer,
    });
  } catch (error) {
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        error: `Customer with this ${duplicateField} already exists`,
      });
    }
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Delete customer
const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found',
      });
    }

    await Customer.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Customer deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Search customers by name or phone
const searchCustomers = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter is required',
      });
    }

    const customers = await Customer.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { phone: { $regex: query, $options: 'i' } },
        { nic: { $regex: query, $options: 'i' } },
      ],
    });

    res.json({
      success: true,
      count: customers.length,
      data: customers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

module.exports = {
  getAllCustomers,
  getCustomerById,
  getCustomerHistory,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  searchCustomers,
};
