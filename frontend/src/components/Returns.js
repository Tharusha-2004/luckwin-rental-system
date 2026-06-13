/**
 * Returns Dashboard Component
 * Interface for processing equipment returns and calculating final amounts due
 */

import React, { useState } from 'react';
import { Search, Package, User, Calendar, DollarSign, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { formatDate, formatCurrency, calculateDaysDifference } from '../utils/helpers';

const Returns = () => {
  // Search state
  const [searchInput, setSearchInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Dummy rental data (will be replaced with API call)
  const [rentalData, setRentalData] = useState(null);
  const [searchError, setSearchError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Dummy data for demonstration
  const DUMMY_RENTAL = {
    _id: '507f1f77bcf86cd799439011',
    agreementToken: 'AGMT-20260610-001',
    customerId: {
      _id: '507f1f77bcf86cd799439001',
      name: 'John Contractor',
      phone: '+94701234567',
      nic: '123456789V',
      address: '123 Main Street',
      city: 'Colombo',
      companyName: 'BuildTech Ltd',
    },
    rentedItems: [
      {
        itemId: {
          _id: '507f1f77bcf86cd799439101',
          name: 'Simenthi Machine',
          category: 'Machinery',
          unit: 'piece',
        },
        quantity: 2,
        dailyRate: 150,
      },
      {
        itemId: {
          _id: '507f1f77bcf86cd799439102',
          name: 'Scaffolding Boards',
          category: 'Scaffolding',
          unit: 'piece',
        },
        quantity: 10,
        dailyRate: 50,
      },
    ],
    rentDate: '2026-06-10',
    expectedReturnDate: '2026-06-20',
    actualReturnDate: null,
    advancePayment: 3000,
    totalCost: 8000,
    finalAmount: null,
    status: 'Active',
    notes: 'Handle with care',
  };

  // Handle search
  const handleSearch = async () => {
    setSearchError('');
    setRentalData(null);

    if (!searchInput.trim()) {
      setSearchError('Please enter Agreement Token or Phone Number');
      return;
    }

    try {
      setIsSearching(true);
      // Simulated API call - In real app, would call:
      // GET /api/rentals/search?token=... or ?phone=...
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // For demo, check if search matches dummy data
      const searchLower = searchInput.toLowerCase().trim();
      if (
        searchLower === DUMMY_RENTAL.agreementToken.toLowerCase() ||
        searchLower === DUMMY_RENTAL.customerId.phone
      ) {
        setRentalData(DUMMY_RENTAL);
        setSearchError('');
      } else {
        setSearchError('No rental found with that Token or Phone Number');
      }
    } catch (error) {
      setSearchError('Error searching for rental. Please try again.');
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle Enter key on search
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Calculate days rented (from rent date to today)
  const calculateDaysRented = () => {
    if (!rentalData) return 0;
    return calculateDaysDifference(rentalData.rentDate, new Date().toISOString().split('T')[0]);
  };

  // Calculate total cost based on actual days
  const calculateTotalCost = () => {
    if (!rentalData) return 0;
    const daysRented = calculateDaysRented();
    return rentalData.rentedItems.reduce((sum, item) => {
      return sum + (item.quantity * item.dailyRate * daysRented);
    }, 0);
  };

  const daysRented = rentalData ? calculateDaysRented() : 0;
  const totalCost = rentalData ? calculateTotalCost() : 0;
  const finalAmountDue = Math.max(0, totalCost - (rentalData?.advancePayment || 0));

  // Handle confirm return
  const handleConfirmReturn = async () => {
    if (!rentalData) return;

    try {
      setIsProcessing(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      setShowSuccessMessage(true);
      // Reset after 3 seconds
      setTimeout(() => {
        setRentalData(null);
        setSearchInput('');
        setShowSuccessMessage(false);
      }, 3000);
    } catch (error) {
      setSearchError('Error processing return. Please try again.');
      console.error('Return error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Package className="text-green-400" size={32} />
          <h1 className="text-4xl font-bold text-white">Equipment Returns</h1>
        </div>
        <p className="text-slate-400">Process returns and calculate final amounts due</p>
      </div>

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="mb-6 bg-green-500/10 border border-green-500 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={24} />
          <div>
            <h3 className="font-semibold text-green-400 text-lg">Return Processed Successfully!</h3>
            <p className="text-green-300 text-sm mt-1">The rental has been marked as returned and inventory has been updated.</p>
          </div>
        </div>
      )}

      {/* Search Section */}
      <div className="bg-slate-700 rounded-xl p-6 shadow-xl mb-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Search size={24} />
          Find Rental
        </h2>

        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-slate-300 font-medium mb-2">
                Agreement Token or Customer Phone
              </label>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="e.g., AGMT-20260610-001 or +94701234567"
                disabled={isSearching}
                className="w-full px-4 py-2 rounded-lg bg-slate-600 text-white placeholder-slate-400 border border-slate-500 focus:border-green-400 focus:outline-none transition disabled:opacity-50"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition transform hover:scale-105"
              >
                {isSearching ? (
                  <>
                    <Loader className="animate-spin" size={20} />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search size={20} />
                    Search
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Search Error */}
          {searchError && (
            <div className="bg-red-500/10 border border-red-500 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
              <p className="text-red-300 text-sm">{searchError}</p>
            </div>
          )}

          {/* Demo Data Note */}
          {!rentalData && (
            <div className="bg-blue-500/10 border border-blue-500 rounded-lg p-3">
              <p className="text-blue-300 text-sm">
                💡 <strong>Demo Mode:</strong> Try searching with "<code className="bg-slate-600 px-2 py-1 rounded">AGMT-20260610-001</code>" 
                or "<code className="bg-slate-600 px-2 py-1 rounded">+94701234567</code>"
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Rental Details & Return Processing */}
      {rentalData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT COLUMN - Rental Details */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Customer Information */}
            <div className="bg-slate-700 rounded-xl p-6 shadow-xl">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <User className="text-blue-400" size={24} />
                Customer Information
              </h2>
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-400 text-sm">Name</p>
                    <p className="text-white font-semibold">{rentalData.customerId.name}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Phone</p>
                    <p className="text-white font-semibold">{rentalData.customerId.phone}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">NIC</p>
                    <p className="text-white font-semibold">{rentalData.customerId.nic}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Company</p>
                    <p className="text-white font-semibold">{rentalData.customerId.companyName || 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Address</p>
                  <p className="text-white">{rentalData.customerId.address}, {rentalData.customerId.city}</p>
                </div>
              </div>
            </div>

            {/* Rental Agreement Details */}
            <div className="bg-slate-700 rounded-xl p-6 shadow-xl">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Calendar className="text-purple-400" size={24} />
                Rental Agreement
              </h2>
              <div className="space-y-4">
                <div className="bg-slate-600 rounded-lg p-4">
                  <p className="text-slate-400 text-sm mb-1">Agreement Token</p>
                  <p className="text-white font-mono text-lg font-bold">{rentalData.agreementToken}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-slate-400 text-sm">Rent Date</p>
                    <p className="text-white font-semibold">{formatDate(rentalData.rentDate)}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Expected Return</p>
                    <p className="text-white font-semibold">{formatDate(rentalData.expectedReturnDate)}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Status</p>
                    <span className="inline-block bg-blue-500/30 text-blue-300 px-3 py-1 rounded-full text-sm font-semibold">
                      {rentalData.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Rented Items */}
            <div className="bg-slate-700 rounded-xl p-6 shadow-xl">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Package className="text-orange-400" size={24} />
                Rented Items ({rentalData.rentedItems.length})
              </h2>
              <div className="space-y-3">
                {rentalData.rentedItems.map((item, index) => (
                  <div key={index} className="bg-slate-600 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-white font-semibold">{item.itemId.name}</p>
                        <p className="text-slate-400 text-sm">{item.itemId.category}</p>
                      </div>
                      <span className="bg-slate-500 text-white px-3 py-1 rounded text-sm font-medium">
                        Qty: {item.quantity}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400">Daily Rate:</span>
                      <span className="text-green-400 font-semibold">Rs. {item.dailyRate}/day</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN - Cost Calculation & Return */}
          <div className="lg:col-span-1">
            <div className="bg-slate-700 rounded-xl p-6 shadow-xl sticky top-6 space-y-4">
              
              {/* Calculation Details */}
              <div>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <DollarSign className="text-yellow-400" size={24} />
                  Cost Calculation
                </h3>

                <div className="space-y-3">
                  {/* Days Rented */}
                  <div className="bg-slate-600 rounded-lg p-3 border border-slate-500">
                    <p className="text-slate-400 text-sm mb-1">Days Rented</p>
                    <p className="text-white text-2xl font-bold">{daysRented} days</p>
                    <p className="text-slate-500 text-xs mt-1">
                      From {formatDate(rentalData.rentDate)} to today
                    </p>
                  </div>

                  {/* Subtotal */}
                  <div className="bg-slate-600 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Subtotal</span>
                      <span className="text-white font-semibold">{formatCurrency(totalCost)}</span>
                    </div>
                    <p className="text-slate-500 text-xs mt-2">
                      ({daysRented} days × item rates)
                    </p>
                  </div>

                  {/* Advance Payment */}
                  <div className="bg-slate-600 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Advance Paid</span>
                      <span className="text-green-400 font-semibold">-{formatCurrency(rentalData.advancePayment)}</span>
                    </div>
                  </div>

                  {/* Amount Due - HIGHLIGHTED */}
                  <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-lg p-4 border-2 border-orange-400">
                    <p className="text-slate-100 text-sm mb-1">Final Amount Due</p>
                    <p className="text-white text-3xl font-bold">{formatCurrency(finalAmountDue)}</p>
                    {finalAmountDue === 0 && (
                      <p className="text-green-300 text-sm mt-2">✓ Fully paid with advance</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes */}
              {rentalData.notes && (
                <div className="bg-slate-600 rounded-lg p-3 border-l-4 border-blue-400">
                  <p className="text-slate-400 text-sm mb-1">Notes</p>
                  <p className="text-white text-sm italic">{rentalData.notes}</p>
                </div>
              )}

              {/* Return Button */}
              <div className="pt-2 border-t border-slate-600">
                <button
                  onClick={handleConfirmReturn}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg font-bold transition transform hover:scale-105"
                >
                  {isProcessing ? (
                    <>
                      <Loader className="animate-spin" size={20} />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={20} />
                      Confirm Return
                    </>
                  )}
                </button>
                <p className="text-slate-400 text-xs text-center mt-3">
                  Clicking this will mark the rental as returned and update inventory
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!rentalData && !searchError && (
        <div className="text-center py-16">
          <Package className="mx-auto text-slate-500 mb-4" size={48} />
          <p className="text-slate-400 text-lg">Search for a rental to begin processing returns</p>
        </div>
      )}
    </div>
  );
};

export default Returns;
