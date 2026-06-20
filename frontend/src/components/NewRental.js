/**
 * Modern POS Interface for Equipment Rental
 * Two-column layout: Customer & Items (Left) | Cart & Summary (Right)
 * Integrated with backend APIs for real-time data
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';
import { ShoppingCart, Plus, Minus, Trash2, PrinterIcon, AlertCircle } from 'lucide-react';

const NewRental = () => {
  // Inventory State
  const [items, setItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(true);

  // Customer Form State
  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
    nic: '',
    photo: null,
  });

  // Selected Items Cart
  const [cartItems, setCartItems] = useState([]);

  // Rental Summary State
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [advancePayment, setAdvancePayment] = useState(0);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [selectedItemQty, setSelectedItemQty] = useState(1);

  // Form Validation & Submission State
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Navigation
  const navigate = useNavigate();

  // Fetch items from backend on component mount
  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setItemsLoading(true);
      const response = await apiClient.get('/items');
      if (response.data.success) {
        setItems(response.data.data);
        setError('');
      }
    } catch (err) {
      setError('Failed to load inventory items');
      console.error('Error fetching items:', err);
    } finally {
      setItemsLoading(false);
    }
  };

  // Handle customer input change
  const handleCustomerChange = (e) => {
    const { name, value } = e.target;
    setCustomer(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  // Add item to cart
  const handleAddToCart = () => {
    if (!selectedItemId) {
      setError('Please select an item');
      return;
    }

    if (selectedItemQty <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }

    const item = items.find(i => i._id === selectedItemId);
    if (!item) return;

    // Check if item already in cart
    const existingItem = cartItems.find(ci => ci._id === item._id);
    if (existingItem) {
      // Update quantity
      setCartItems(cartItems.map(ci =>
        ci._id === item._id
          ? { ...ci, quantity: ci.quantity + selectedItemQty }
          : ci
      ));
    } else {
      // Add new item
      setCartItems([...cartItems, { ...item, quantity: selectedItemQty }]);
    }

    // Reset selection
    setSelectedItemId('');
    setSelectedItemQty(1);
    setError('');
  };

  // Remove item from cart
  const handleRemoveFromCart = (itemId) => {
    setCartItems(cartItems.filter(item => item._id !== itemId));
  };

  // Update item quantity
  const handleUpdateQuantity = (itemId, newQty) => {
    if (newQty <= 0) {
      handleRemoveFromCart(itemId);
      return;
    }
    setCartItems(cartItems.map(item =>
      item._id === itemId ? { ...item, quantity: newQty } : item
    ));
  };

  // Calculate rental days
  const calculateDays = () => {
    if (!expectedReturnDate) return 0;
    const today = new Date();
    const returnDate = new Date(expectedReturnDate);
    const diffTime = returnDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays);
  };

  // Calculate totals
  const rentalDays = calculateDays();
  const totalCost = cartItems.reduce((sum, item) => {
    return sum + (item.quantity * item.dailyRate * rentalDays);
  }, 0);
  const amountDue = Math.max(0, totalCost - advancePayment);

  // Handle form submission with backend API calls
  const handleGenerateRental = async () => {
    setError('');
    setSuccess('');

    // Validation
    if (!customer.name.trim() || customer.name.trim().length < 3) {
      setError('Customer name must be at least 3 characters');
      return;
    }
    if (!customer.phone.trim()) {
      setError('Phone number is required');
      return;
    }
    if (!customer.nic.trim()) {
      setError('NIC is required');
      return;
    }
    if (cartItems.length === 0) {
      setError('Please add at least one item to rent');
      return;
    }
    if (!expectedReturnDate) {
      setError('Expected return date is required');
      return;
    }
    if (advancePayment < 0) {
      setError('Advance payment cannot be negative');
      return;
    }
    if (advancePayment > totalCost) {
      setError('Advance payment cannot exceed total cost');
      return;
    }

    try {
      setIsSubmitting(true);

      // Step A: Create/Register customer
      console.log('Step A: Creating customer...');
      const customerResponse = await apiClient.post('/customers', {
        name: customer.name.trim(),
        phone: customer.phone.trim(),
        nic: customer.nic.trim(),
        photo: customer.photo,
      });

      if (!customerResponse.data.success) {
        throw new Error(customerResponse.data.message || 'Failed to create customer');
      }

      const customerId = customerResponse.data.data._id;
      console.log('✓ Customer created:', customerId);

      // Step B: Map cart items to backend schema
      console.log('Step B: Mapping cart items...');
      const rentedItems = cartItems.map(item => ({
        itemId: item._id,
        quantity: item.quantity,
        dailyRate: item.dailyRate,
      }));

      // Step C: Create rental
      console.log('Step C: Creating rental...');
      const rentalResponse = await apiClient.post('/rentals', {
        customerId,
        rentedItems,
        expectedReturnDate,
        advancePayment: parseFloat(advancePayment),
      });

      if (!rentalResponse.data.success) {
        throw new Error(rentalResponse.data.message || 'Failed to create rental');
      }

      const agreementToken = rentalResponse.data.data.agreementToken;
      console.log('✓ Rental created with token:', agreementToken);

      // Step D: Navigate to receipt
      setSuccess('✓ Rental agreement generated successfully! Redirecting to receipt...');
      setTimeout(() => {
        navigate(`/receipt/${agreementToken}`);
      }, 1500);

    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create rental';
      setError(`Error: ${errorMessage}`);
      console.error('Error creating rental:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <ShoppingCart className="text-blue-400" size={32} />
          <h1 className="text-4xl font-bold text-white">POS - New Rental</h1>
        </div>
        <p className="text-slate-400">Equipment Rental Point of Sale System</p>
      </div>

      {/* Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN - Customer & Items Selection */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Alert Messages */}
          {error && (
            <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <h3 className="font-semibold text-red-400">Error</h3>
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-500/10 border border-green-500 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="text-green-500 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <h3 className="font-semibold text-green-400">Success</h3>
                <p className="text-green-300 text-sm">{success}</p>
              </div>
            </div>
          )}

          {/* Customer Information Section */}
          <div className="bg-slate-700 rounded-xl p-6 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-sm font-bold">1</div>
              Customer Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 font-medium mb-2">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={customer.name}
                  onChange={handleCustomerChange}
                  placeholder="e.g., John Contractor"
                  className="w-full px-4 py-2 rounded-lg bg-slate-600 text-white placeholder-slate-400 border border-slate-500 focus:border-blue-400 focus:outline-none transition"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-2">Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  value={customer.phone}
                  onChange={handleCustomerChange}
                  placeholder="e.g., +94701234567"
                  className="w-full px-4 py-2 rounded-lg bg-slate-600 text-white placeholder-slate-400 border border-slate-500 focus:border-blue-400 focus:outline-none transition"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-2">National ID (NIC) *</label>
                <input
                  type="text"
                  name="nic"
                  value={customer.nic}
                  onChange={handleCustomerChange}
                  placeholder="e.g., 123456789V"
                  className="w-full px-4 py-2 rounded-lg bg-slate-600 text-white placeholder-slate-400 border border-slate-500 focus:border-blue-400 focus:outline-none transition"
                />
              </div>
              
              {/* Photo Input */}
              <div>
                <label className="block text-slate-300 font-medium mb-2">Customer Photo (Optional)</label>
                <div className="flex items-center gap-4">
                  {customer.photo ? (
                    <div className="relative">
                      <img src={customer.photo} alt="Preview" className="w-16 h-16 rounded-full object-cover border-2 border-slate-600" />
                      <button
                        type="button"
                        onClick={() => setCustomer({ ...customer, photo: null })}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 shadow-md"
                        title="Remove photo"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-dashed border-slate-600 flex items-center justify-center">
                      <span className="text-slate-500 text-xs text-center">No<br/>Photo</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setCustomer({ ...customer, photo: reader.result });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600/20 file:text-blue-400 hover:file:bg-blue-600/30 transition-all cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Item Selection Section */}
          <div className="bg-slate-700 rounded-xl p-6 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-sm font-bold">2</div>
              Select Items
            </h2>
            
            <div className="space-y-4">
              {/* Item Dropdown */}
              <div>
                <label className="block text-slate-300 font-medium mb-2">Equipment *</label>
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  disabled={itemsLoading}
                  className="w-full px-4 py-2 rounded-lg bg-slate-600 text-white border border-slate-500 focus:border-blue-400 focus:outline-none transition disabled:opacity-50"
                >
                  <option value="">{itemsLoading ? '-- Loading Equipment --' : '-- Select Equipment --'}</option>
                  {items.map(item => (
                    <option key={item._id} value={item._id}>
                      {item.name} - Rs. {item.dailyRate}/day (Available: {item.availableQuantity})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity Input */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-slate-300 font-medium mb-2">Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    value={selectedItemQty}
                    onChange={(e) => setSelectedItemQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-4 py-2 rounded-lg bg-slate-600 text-white border border-slate-500 focus:border-blue-400 focus:outline-none transition"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleAddToCart}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition transform hover:scale-105"
                  >
                    <Plus size={20} />
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>

            {/* Items in Inventory List */}
            <div className="mt-6 pt-4 border-t border-slate-600">
              <p className="text-slate-400 text-sm mb-3">Available Equipment:</p>
              {itemsLoading ? (
                <p className="text-slate-400 text-sm">Loading inventory...</p>
              ) : items.length === 0 ? (
                <p className="text-slate-400 text-sm">No items available</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {items.map(item => (
                    <div key={item._id} className="bg-slate-600 rounded p-2 text-sm">
                      <p className="text-slate-200 font-medium">{item.name}</p>
                      <p className="text-slate-400">Rs. {item.dailyRate}/day</p>
                      <p className="text-slate-500 text-xs">Available: {item.availableQuantity}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - Cart & Summary */}
        <div className="lg:col-span-1">
          <div className="bg-slate-700 rounded-xl p-6 shadow-xl sticky top-6 space-y-4">
            
            {/* Cart Header */}
            <div className="flex items-center gap-2 pb-4 border-b border-slate-600">
              <ShoppingCart className="text-green-400" size={24} />
              <h2 className="text-xl font-bold text-white">Rental Cart</h2>
              <span className="ml-auto bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                {cartItems.length} items
              </span>
            </div>

            {/* Cart Items */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {cartItems.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No items in cart</p>
              ) : (
                cartItems.map(item => (
                  <div key={item._id} className="bg-slate-600 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-white font-medium text-sm">{item.name}</p>
                        <p className="text-slate-400 text-xs">Rs. {item.dailyRate}/day</p>
                      </div>
                      <button
                        onClick={() => handleRemoveFromCart(item._id)}
                        className="text-red-400 hover:text-red-300 transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateQuantity(item._id, item.quantity - 1)}
                        className="bg-slate-500 hover:bg-slate-400 text-white p-1 rounded transition"
                      >
                        <Minus size={14} />
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleUpdateQuantity(item._id, parseInt(e.target.value) || 1)}
                        className="flex-1 bg-slate-500 text-white text-center py-1 rounded text-sm focus:outline-none"
                      />
                      <button
                        onClick={() => handleUpdateQuantity(item._id, item.quantity + 1)}
                        className="bg-slate-500 hover:bg-slate-400 text-white p-1 rounded transition"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    
                    {/* Item Total */}
                    <div className="text-right pt-2 border-t border-slate-500">
                      <p className="text-green-400 font-bold text-sm">
                        Rs. {(item.quantity * item.dailyRate * rentalDays).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Divider */}
            {cartItems.length > 0 && <div className="border-t border-slate-600"></div>}

            {/* Rental Details */}
            {cartItems.length > 0 && (
              <div className="space-y-4">
                {/* Expected Return Date */}
                <div>
                  <label className="block text-slate-300 font-medium mb-2">Expected Return Date *</label>
                  <input
                    type="date"
                    value={expectedReturnDate}
                    onChange={(e) => setExpectedReturnDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 rounded-lg bg-slate-600 text-white border border-slate-500 focus:border-blue-400 focus:outline-none transition text-sm"
                  />
                  {rentalDays > 0 && (
                    <p className="text-slate-400 text-xs mt-1">Duration: {rentalDays} day(s)</p>
                  )}
                </div>

                {/* Advance Payment */}
                <div>
                  <label className="block text-slate-300 font-medium mb-2">Advance Payment (Rs.)</label>
                  <input
                    type="number"
                    min="0"
                    max={totalCost}
                    value={advancePayment}
                    onChange={(e) => setAdvancePayment(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-600 text-white border border-slate-500 focus:border-blue-400 focus:outline-none transition"
                  />
                  <p className="text-slate-400 text-xs mt-1">Max: Rs. {totalCost.toLocaleString()}</p>
                </div>

                {/* Cost Summary */}
                <div className="bg-slate-600 rounded-lg p-4 space-y-2 border border-slate-500">
                  <div className="flex justify-between text-slate-300">
                    <span>Subtotal:</span>
                    <span>Rs. {totalCost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Advance Payment:</span>
                    <span className="text-green-400">-Rs. {advancePayment.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-slate-500 pt-2 flex justify-between">
                    <span className="font-bold text-white">Amount Due:</span>
                    <span className={`font-bold text-lg ${amountDue > 0 ? 'text-orange-400' : 'text-green-400'}`}>
                      Rs. {amountDue.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2 pt-4 border-t border-slate-600">
              <button
                onClick={handleGenerateRental}
                disabled={cartItems.length === 0 || isSubmitting}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg font-bold transition transform hover:scale-105"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <PrinterIcon size={20} />
                    Generate Rental & Print
                  </>
                )}
              </button>
              <button
                onClick={handlePrint}
                disabled={cartItems.length === 0}
                className="w-full bg-slate-600 hover:bg-slate-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition"
              >
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewRental;
