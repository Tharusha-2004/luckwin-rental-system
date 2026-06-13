/**
 * Returns Dashboard Component
 * Interface for processing equipment returns and calculating final amounts due
 * Integrated with backend APIs for real-time data
 */

import React, { useState } from 'react';
import apiClient from '../services/api';
import { Search, Package, User, Calendar, DollarSign, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { formatDate, formatCurrency, calculateDaysDifference } from '../utils/helpers';

const Returns = () => {
  // Search state
  const [searchInput, setSearchInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Rental data from API
  const [rentalData, setRentalData] = useState(null);
  const [searchError, setSearchError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Handle search - Fetch rental by agreement token
  const handleSearch = async () => {
    setSearchError('');
    setRentalData(null);

    const token = searchInput.trim();
    if (!token) {
      setSearchError('Please enter an Agreement Token');
      return;
    }

    try {
      setIsSearching(true);
      console.log('Fetching rental with token:', token);

      // GET /api/receipt/{token} - fetch rental by agreement token
      const response = await apiClient.get(`/receipt/${token}`);

      if (response.data.success && response.data.data) {
        setRentalData(response.data.data);
        setSearchError('');
      } else {
        setSearchError(response.data.message || 'Rental not found');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Error searching for rental. Please try again.';
      setSearchError(errorMsg);
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

  // Calculate days rented (from rent date to today) - at least 1 day
  const calculateDaysRented = () => {
    if (!rentalData) return 0;
    const today = new Date().toISOString().split('T')[0];
    const days = calculateDaysDifference(rentalData.rentDate, today);
    return Math.max(1, days);
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

  // Handle confirm return - POST to API
  const handleConfirmReturn = async () => {
    if (!rentalData || !rentalData._id) return;

    try {
      setIsProcessing(true);
      setSearchError('');
      console.log('Processing return for rental:', rentalData._id);

      // POST /api/rentals/:id/return - confirm return and update inventory
      const response = await apiClient.post(`/rentals/${rentalData._id}/return`, {
        actualReturnDate: new Date().toISOString().split('T')[0],
      });

      if (response.data.success) {
        console.log('Return processed successfully:', response.data.data);
        setShowSuccessMessage(true);
        
        // Reset after 3 seconds
        setTimeout(() => {
          setRentalData(null);
          setSearchInput('');
          setShowSuccessMessage(false);
        }, 3000);
      } else {
        setSearchError(response.data.message || 'Failed to process return');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Error processing return. Please try again.';
      setSearchError(errorMsg);
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
                Agreement Token *
              </label>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="e.g., AGMT-20260610-001"
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

          {/* Info Message */}
          {!rentalData && !searchError && (
            <div className="bg-blue-500/10 border border-blue-500 rounded-lg p-3">
              <p className="text-blue-300 text-sm">
                💡 Enter an agreement token and click Search to find the rental. The system will fetch live data from the backend.
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
                    <p className="text-white font-semibold">{rentalData?.customer?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Phone</p>
                    <p className="text-white font-semibold">{rentalData?.customer?.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">NIC</p>
                    <p className="text-white font-semibold">{rentalData?.customer?.nic || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Company</p>
                    <p className="text-white font-semibold">{rentalData?.customer?.companyName || 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Address</p>
                  <p className="text-white">{rentalData?.customer?.address || 'N/A'}</p>
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
                  <p className="text-white font-mono text-lg font-bold">{rentalData?.agreementToken || 'N/A'}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-slate-400 text-sm">Rent Date</p>
                    <p className="text-white font-semibold">{rentalData?.rentDate ? formatDate(rentalData.rentDate) : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Expected Return</p>
                    <p className="text-white font-semibold">{rentalData?.expectedReturnDate ? formatDate(rentalData.expectedReturnDate) : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Status</p>
                    <span className="inline-block bg-blue-500/30 text-blue-300 px-3 py-1 rounded-full text-sm font-semibold">
                      {rentalData?.status || 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Rented Items */}
            <div className="bg-slate-700 rounded-xl p-6 shadow-xl">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Package className="text-orange-400" size={24} />
                Rented Items ({rentalData?.rentedItems?.length || 0})
              </h2>
              <div className="space-y-3">
                {rentalData?.rentedItems && rentalData.rentedItems.length > 0 ? (
                  rentalData.rentedItems.map((item, index) => (
                    <div key={index} className="bg-slate-600 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-white font-semibold">{item?.name || 'Unknown Item'}</p>
                          <p className="text-slate-400 text-sm">Equipment Rental</p>
                        </div>
                        <span className="bg-slate-500 text-white px-3 py-1 rounded text-sm font-medium">
                          Qty: {item?.quantity || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400">Daily Rate:</span>
                        <span className="text-green-400 font-semibold">Rs. {item?.dailyRate || 0}/day</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-center py-4">No items in this rental</p>
                )}
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
                      From {rentalData?.rentDate ? formatDate(rentalData.rentDate) : 'N/A'} to today
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
                      <span className="text-green-400 font-semibold">-{formatCurrency(rentalData?.advancePayment || 0)}</span>
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
              {rentalData?.notes && (
                <div className="bg-slate-600 rounded-lg p-3 border-l-4 border-blue-400">
                  <p className="text-slate-400 text-sm mb-1">Notes</p>
                  <p className="text-white text-sm italic">{rentalData?.notes}</p>
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
