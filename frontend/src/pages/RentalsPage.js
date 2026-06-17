/**
 * Rentals Page Component
 * Create, view, and manage rental transactions with POS-style flow
 */

import React, { useState, useEffect } from 'react';
import { rentalsAPI, customersAPI, itemsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import SuccessAlert from '../components/SuccessAlert';
import { formatDate, formatCurrency, calculateDaysDifference } from '../utils/helpers';
import { Plus, X, AlertCircle, Copy } from 'lucide-react';

const RentalsPage = () => {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showNewRentalForm, setShowNewRentalForm] = useState(false);

  // Form state
  const [customers, setCustomers] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [advancePayment, setAdvancePayment] = useState(0);
  const [formSubmitting, setFormSubmitting] = useState(false);

  useEffect(() => {
    fetchRentals();
    fetchCustomers();
    fetchItems();
  }, []);

  const fetchRentals = async () => {
    try {
      setLoading(true);
      const response = await rentalsAPI.getAll();
      if (response.data.success) {
        setRentals(response.data.data);
        setError('');
      }
    } catch (err) {
      setError('Failed to load rentals');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await customersAPI.getAll();
      if (response.data.success) {
        setCustomers(response.data.data);
      }
    } catch (err) {
      console.error('Failed to load customers');
    }
  };

  const fetchItems = async () => {
    try {
      const response = await itemsAPI.getAll();
      if (response.data.success) {
        setItems(response.data.data.filter((item) => item.availableQuantity > 0));
      }
    } catch (err) {
      console.error('Failed to load items');
    }
  };

  const handleAddItem = () => {
    setSelectedItems([
      ...selectedItems,
      { itemId: '', quantity: 1 },
    ]);
  };

  const handleUpdateItem = (index, field, value) => {
    const updated = [...selectedItems];
    updated[index][field] = value;
    setSelectedItems(updated);
  };

  const handleRemoveItem = (index) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const calculateTotalCost = () => {
    const days = calculateDaysDifference(new Date(), new Date(expectedReturnDate));
    let total = 0;

    selectedItems.forEach((item) => {
      const itemData = items.find((i) => i._id === item.itemId);
      if (itemData) {
        total += item.quantity * itemData.dailyRate * days;
      }
    });

    return total;
  };

  const handleSubmitRental = async (e) => {
    e.preventDefault();

    if (!selectedCustomer || !expectedReturnDate) {
      setError('Please fill in all required fields');
      return;
    }

    if (selectedItems.length === 0) {
      setError('Please add at least one item to the rental.');
      return;
    }

    if (selectedItems.some(item => !item.quantity || item.quantity <= 0)) {
      setError('All rented items must have a quantity greater than zero.');
      return;
    }

    const totalCost = calculateTotalCost();
    if (advancePayment > totalCost) {
      setError('Advance payment cannot exceed total cost');
      return;
    }

    try {
      setFormSubmitting(true);
      const rentalData = {
        customerId: selectedCustomer,
        rentedItems: selectedItems,
        expectedReturnDate,
        advancePayment: parseFloat(advancePayment),
      };

      const response = await rentalsAPI.create(rentalData);
      if (response.data.success) {
        setSuccess('Rental created successfully!');
        setShowNewRentalForm(false);
        setSelectedCustomer('');
        setSelectedItems([]);
        setExpectedReturnDate('');
        setAdvancePayment(0);
        fetchRentals();
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to connect to the server. Please check your network.");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleProcessReturn = async (id) => {
    if (window.confirm('Process return for this rental?')) {
      try {
        await rentalsAPI.processReturn(id);
        setSuccess('Rental returned successfully');
        fetchRentals();
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to process return');
      }
    }
  };

  const handleCopyToken = (token) => {
    navigator.clipboard.writeText(token);
    setSuccess('Token copied to clipboard!');
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const totalCost = calculateTotalCost();
  const finalAmount = totalCost - parseFloat(advancePayment || 0);

  return (
    <div className="p-6">
      {error && <ErrorAlert message={error} onClose={() => setError('')} />}
      {success && <SuccessAlert message={success} onClose={() => setSuccess('')} />}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Rental Management</h1>
        <button
          onClick={() => setShowNewRentalForm(!showNewRentalForm)}
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          <Plus size={20} />
          New Rental
        </button>
      </div>

      {/* New Rental Form - POS Style */}
      {showNewRentalForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Create New Rental</h2>
          <form onSubmit={handleSubmitRental}>
            {/* Customer Selection */}
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2">Select Customer *</label>
              <select
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="">-- Choose a customer --</option>
                {customers.map((customer) => (
                  <option key={customer._id} value={customer._id}>
                    {customer.name} ({customer.phone})
                  </option>
                ))}
              </select>
            </div>

            {/* Items Selection */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-semibold">Rented Items *</label>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="text-blue-500 hover:text-blue-700 text-sm flex items-center gap-1"
                >
                  <Plus size={16} />
                  Add Item
                </button>
              </div>

              {selectedItems.length > 0 ? (
                <div className="bg-gray-50 rounded p-4">
                  {selectedItems.map((item, index) => {
                    const itemData = items.find((i) => i._id === item.itemId);
                    const days = calculateDaysDifference(new Date(), new Date(expectedReturnDate));
                    const itemCost = itemData ? item.quantity * itemData.dailyRate * days : 0;

                    return (
                      <div key={index} className="bg-white border rounded p-4 mb-3 flex gap-4 items-end">
                        <div className="flex-1">
                          <label className="text-xs font-semibold text-gray-600">Item</label>
                          <select
                            value={item.itemId}
                            onChange={(e) => handleUpdateItem(index, 'itemId', e.target.value)}
                            className="w-full border border-gray-300 rounded px-3 py-2 mt-1"
                          >
                            <option value="">-- Select item --</option>
                            {items.map((itm) => (
                              <option key={itm._id} value={itm._id}>
                                {itm.name} (Available: {itm.availableQuantity}) - ${itm.dailyRate}/day
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="w-20">
                          <label className="text-xs font-semibold text-gray-600">Qty</label>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              handleUpdateItem(index, 'quantity', parseInt(e.target.value) || 1)
                            }
                            className="w-full border border-gray-300 rounded px-3 py-2 mt-1"
                            min="1"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-gray-600">Cost</label>
                          <div className="text-lg font-bold text-blue-600 mt-1">
                            {formatCurrency(itemCost)}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="text-red-500 hover:text-red-700 p-2"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-gray-50 rounded p-4 text-center text-gray-500">
                  Click "Add Item" to select items for rental
                </div>
              )}
            </div>

            {/* Rental Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-semibold mb-2">Expected Return Date *</label>
                <input
                  type="date"
                  value={expectedReturnDate}
                  onChange={(e) => setExpectedReturnDate(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Advance Payment</label>
                <input
                  type="number"
                  value={advancePayment}
                  onChange={(e) => setAdvancePayment(parseFloat(e.target.value) || 0)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  step="0.01"
                  min="0"
                  max={totalCost}
                />
              </div>
            </div>

            {/* Cost Summary */}
            {selectedItems.length > 0 && expectedReturnDate && (
              <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-gray-600">Duration</p>
                    <p className="text-lg font-bold text-blue-600">
                      {calculateDaysDifference(new Date(), new Date(expectedReturnDate))} days
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Total Cost</p>
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(totalCost)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Amount Due</p>
                    <p className={`text-lg font-bold ${finalAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {finalAmount > 0 ? formatCurrency(finalAmount) : 'Fully Paid'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={formSubmitting || selectedItems.length === 0}
                className="flex-1 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
              >
                {formSubmitting ? 'Creating...' : 'Create Rental'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowNewRentalForm(false);
                  setSelectedCustomer('');
                  setSelectedItems([]);
                  setExpectedReturnDate('');
                  setAdvancePayment(0);
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Rentals List */}
      <div className="space-y-4">
        {rentals.length > 0 ? (
          rentals.map((rental) => (
            <div key={rental._id} className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-600 uppercase">Customer</p>
                  <p className="font-semibold text-gray-900">{rental.customerId.name}</p>
                  <p className="text-sm text-gray-600">{rental.customerId.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 uppercase">Agreement Token</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="font-mono text-sm font-semibold text-blue-600">
                      {rental.agreementToken.slice(0, 12)}...
                    </p>
                    <button
                      onClick={() => handleCopyToken(rental.agreementToken)}
                      className="text-gray-400 hover:text-gray-600"
                      title="Copy full token"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-600 uppercase">Dates</p>
                  <p className="text-sm text-gray-900">
                    {formatDate(rental.rentDate)} → {formatDate(rental.expectedReturnDate)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 uppercase">Status</p>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                      rental.status === 'Returned'
                        ? 'bg-green-100 text-green-800'
                        : rental.status === 'Overdue'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {rental.status}
                  </span>
                </div>
              </div>

              {/* Items */}
              <div className="bg-gray-50 rounded p-3 mb-4">
                <p className="text-xs font-semibold text-gray-600 mb-2">ITEMS:</p>
                <div className="space-y-1">
                  {rental.rentedItems.map((item, idx) => (
                    <p key={idx} className="text-sm text-gray-700">
                      • {item.itemId.name} × {item.quantity} @ ${item.dailyRate}/day
                    </p>
                  ))}
                </div>
              </div>

              {/* Financial Info */}
              <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                <div className="bg-blue-50 rounded p-2">
                  <p className="text-xs text-gray-600">Subtotal</p>
                  <p className="font-semibold text-gray-900">{formatCurrency(rental.totalCost)}</p>
                </div>
                <div className="bg-green-50 rounded p-2">
                  <p className="text-xs text-gray-600">Advance Paid</p>
                  <p className="font-semibold text-green-700">{formatCurrency(rental.advancePayment)}</p>
                </div>
                <div className={`rounded p-2 ${rental.finalAmount > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                  <p className="text-xs text-gray-600">Amount Due</p>
                  <p className={`font-semibold ${rental.finalAmount > 0 ? 'text-red-700' : 'text-green-700'}`}>
                    {formatCurrency(rental.finalAmount)}
                  </p>
                </div>
              </div>

              {/* Actions */}
              {rental.status !== 'Returned' && (
                <div className="flex justify-end">
                  <button
                    onClick={() => handleProcessReturn(rental._id)}
                    className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600"
                  >
                    Process Return
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
            No rentals found. Create your first rental!
          </div>
        )}
      </div>
    </div>
  );
};

export default RentalsPage;
