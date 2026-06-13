/**
 * Returns Component
 * Search active rentals by Agreement Token OR Customer NIC.
 * When multiple active rentals exist (NIC search), shows a selection list
 * before revealing the full return-processing panel.
 */

import React, { useState } from 'react';
import apiClient from '../services/api';
import {
  Search,
  Package,
  User,
  Calendar,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Loader,
  ChevronRight,
  Clock,
  CreditCard,
} from 'lucide-react';
import { formatDate, formatCurrency, calculateDaysDifference } from '../utils/helpers';

const Returns = () => {
  // ── Search state ─────────────────────────────────────────────────────────
  const [searchInput, setSearchInput]       = useState('');
  const [isSearching, setIsSearching]       = useState(false);
  const [searchError, setSearchError]       = useState('');

  // ── Results state ─────────────────────────────────────────────────────────
  // results = array of rentals returned from API (1 for token, N for NIC)
  const [results, setResults]               = useState([]);
  const [searchType, setSearchType]         = useState(''); // 'token' | 'nic'

  // ── Selected rental for processing ───────────────────────────────────────
  const [rentalData, setRentalData]         = useState(null);

  // ── Return processing state ───────────────────────────────────────────────
  const [isProcessing, setIsProcessing]     = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // ── Handle search ─────────────────────────────────────────────────────────
  const handleSearch = async () => {
    setSearchError('');
    setResults([]);
    setRentalData(null);
    setShowSuccessMessage(false);

    const query = searchInput.trim();
    if (!query) {
      setSearchError('Please enter an Agreement Token or Customer NIC.');
      return;
    }

    try {
      setIsSearching(true);
      // apiClient automatically attaches Authorization: Bearer <token>
      const response = await apiClient.get(`/rentals/search/${encodeURIComponent(query)}`);

      if (response.data.success) {
        const data = response.data.data;
        setSearchType(response.data.searchType);

        if (data.length === 1) {
          // Single result — go straight to processing panel
          setRentalData(data[0]);
        } else {
          // Multiple results (NIC search) — show selection list
          setResults(data);
        }
      } else {
        setSearchError(response.data.error || 'Rental not found.');
      }
    } catch (err) {
      setSearchError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Error searching for rental. Please try again.'
      );
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  // ── Select a specific rental from multi-result list ───────────────────────
  const handleSelectRental = (rental) => {
    setResults([]);
    setRentalData(rental);
  };

  // ── Reset back to search ───────────────────────────────────────────────────
  const handleReset = () => {
    setRentalData(null);
    setResults([]);
    setSearchError('');
    setSearchInput('');
    setShowSuccessMessage(false);
  };

  // ── Cost helpers ──────────────────────────────────────────────────────────
  const calculateDaysRented = () => {
    if (!rentalData) return 0;
    const today = new Date().toISOString().split('T')[0];
    return Math.max(1, calculateDaysDifference(rentalData.rentDate, today));
  };

  const calculateTotalCost = () => {
    if (!rentalData) return 0;
    const days = calculateDaysRented();
    return rentalData.rentedItems.reduce(
      (sum, item) => sum + item.quantity * item.dailyRate * days,
      0
    );
  };

  const daysRented      = rentalData ? calculateDaysRented()  : 0;
  const totalCost       = rentalData ? calculateTotalCost()   : 0;
  const finalAmountDue  = Math.max(0, totalCost - (rentalData?.advancePayment || 0));

  // ── Confirm return ────────────────────────────────────────────────────────
  const handleConfirmReturn = async () => {
    if (!rentalData?._id) return;
    try {
      setIsProcessing(true);
      setSearchError('');

      const response = await apiClient.post(`/rentals/${rentalData._id}/return`, {
        actualReturnDate: new Date().toISOString().split('T')[0],
      });

      if (response.data.success) {
        setShowSuccessMessage(true);
        setTimeout(() => {
          handleReset();
        }, 3500);
      } else {
        setSearchError(response.data.message || 'Failed to process return.');
      }
    } catch (err) {
      setSearchError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Error processing return. Please try again.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Package className="text-green-400" size={32} />
          <h1 className="text-4xl font-bold text-white">Equipment Returns</h1>
        </div>
        <p className="text-slate-400">
          Search by Agreement Token or Customer NIC to process a return
        </p>
      </div>

      {/* ── Success Banner ──────────────────────────────────────────────── */}
      {showSuccessMessage && (
        <div className="mb-6 bg-green-500/10 border border-green-500 rounded-xl p-4 flex items-start gap-3">
          <CheckCircle className="text-green-400 flex-shrink-0 mt-0.5" size={24} />
          <div>
            <p className="text-green-300 font-semibold text-lg">Return Processed Successfully!</p>
            <p className="text-green-400 text-sm mt-1">
              The rental has been marked as returned and inventory has been updated.
            </p>
          </div>
        </div>
      )}

      {/* ── Search Panel ────────────────────────────────────────────────── */}
      <div className="bg-slate-700 rounded-xl p-6 shadow-xl mb-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Search size={22} /> Find Rental
        </h2>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-slate-300 font-medium mb-2 text-sm">
              Agreement Token or Customer NIC *
            </label>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="e.g., AGMT-2026... or 200405..."
              disabled={isSearching}
              className="w-full px-4 py-2.5 rounded-lg bg-slate-600 text-white placeholder-slate-400 border border-slate-500 focus:border-green-400 focus:outline-none transition disabled:opacity-50"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg font-medium transition transform hover:scale-105"
            >
              {isSearching ? (
                <><Loader className="animate-spin" size={20} /> Searching…</>
              ) : (
                <><Search size={20} /> Search</>
              )}
            </button>
          </div>
        </div>

        {/* Error */}
        {searchError && (
          <div className="mt-4 bg-red-500/10 border border-red-500 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={18} />
            <p className="text-red-300 text-sm">{searchError}</p>
          </div>
        )}

        {/* Hint */}
        {!results.length && !rentalData && !searchError && (
          <div className="mt-4 bg-blue-500/10 border border-blue-500/40 rounded-lg p-3">
            <p className="text-blue-300 text-sm">
              💡 Enter an <span className="font-semibold">Agreement Token</span> for a specific
              rental, or a <span className="font-semibold">Customer NIC</span> to see all their
              active rentals.
            </p>
          </div>
        )}
      </div>

      {/* ── Multi-result Selection List (NIC search) ─────────────────────── */}
      {results.length > 1 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white font-bold text-lg flex items-center gap-2">
              <CreditCard className="text-indigo-400" size={20} />
              {results.length} Active Rental{results.length !== 1 ? 's' : ''} found for this customer
            </h2>
            <button onClick={handleReset} className="text-slate-400 hover:text-slate-200 text-sm underline">
              New search
            </button>
          </div>

          <div className="grid gap-3">
            {results.map((rental) => {
              const customer = rental.customerId;
              const itemNames = rental.rentedItems
                .map((ri) => ri.itemId?.name || 'Unknown')
                .join(', ');
              const isOverdue = rental.status === 'Overdue';

              return (
                <div
                  key={rental._id}
                  className="bg-slate-700 border border-slate-600 hover:border-green-500/60 rounded-xl p-5 flex items-center justify-between group transition-all duration-200 cursor-pointer"
                  onClick={() => handleSelectRental(rental)}
                >
                  <div className="flex-1 min-w-0">
                    {/* Token + status */}
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className="font-mono text-blue-300 text-sm font-semibold truncate">
                        {rental.agreementToken}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          isOverdue
                            ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                            : 'bg-green-500/20 text-green-300 border border-green-500/40'
                        }`}
                      >
                        {isOverdue ? <AlertCircle size={10} /> : <CheckCircle size={10} />}
                        {rental.status}
                      </span>
                    </div>

                    {/* Items & dates */}
                    <p className="text-white text-sm font-medium truncate">{itemNames}</p>
                    <div className="flex items-center gap-4 mt-1.5 text-slate-400 text-xs">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        Rented: {formatDate(rental.rentDate)}
                      </span>
                      <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-400' : ''}`}>
                        <Clock size={12} />
                        Due: {formatDate(rental.expectedReturnDate)}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign size={12} />
                        Rs. {(rental.totalCost || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="ml-4 flex items-center gap-2 text-green-400 group-hover:text-green-300 transition-colors flex-shrink-0">
                    <span className="text-sm font-semibold hidden sm:block">Process Return</span>
                    <ChevronRight size={20} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Return Processing Panel ──────────────────────────────────────── */}
      {rentalData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT — Rental Details */}
          <div className="lg:col-span-2 space-y-6">

            {/* Back link when arrived via NIC */}
            {searchType === 'nic' && (
              <button
                onClick={handleReset}
                className="text-slate-400 hover:text-slate-200 text-sm flex items-center gap-1 transition"
              >
                ← Back to search
              </button>
            )}

            {/* Customer Information */}
            <div className="bg-slate-700 rounded-xl p-6 shadow-xl">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <User className="text-blue-400" size={22} /> Customer Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'Name',    value: rentalData.customerId?.name },
                  { label: 'Phone',   value: rentalData.customerId?.phone },
                  { label: 'NIC',     value: rentalData.customerId?.nic },
                  { label: 'Company', value: rentalData.customerId?.companyName },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-slate-400 text-sm">{label}</p>
                    <p className="text-white font-semibold mt-0.5">{value || '—'}</p>
                  </div>
                ))}
                {rentalData.customerId?.address && (
                  <div className="sm:col-span-2">
                    <p className="text-slate-400 text-sm">Address</p>
                    <p className="text-white mt-0.5">{rentalData.customerId.address}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Agreement Details */}
            <div className="bg-slate-700 rounded-xl p-6 shadow-xl">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Calendar className="text-purple-400" size={22} /> Rental Agreement
              </h2>
              <div className="bg-slate-600 rounded-lg p-4 mb-4">
                <p className="text-slate-400 text-xs mb-1">Agreement Token</p>
                <p className="text-white font-mono text-base font-bold break-all">
                  {rentalData.agreementToken}
                </p>
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
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mt-0.5 ${
                      rentalData.status === 'Overdue'
                        ? 'bg-red-500/30 text-red-300'
                        : 'bg-blue-500/30 text-blue-300'
                    }`}
                  >
                    {rentalData.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Rented Items */}
            <div className="bg-slate-700 rounded-xl p-6 shadow-xl">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Package className="text-orange-400" size={22} />
                Rented Items ({rentalData.rentedItems?.length || 0})
              </h2>
              <div className="space-y-3">
                {rentalData.rentedItems?.map((item, i) => (
                  <div key={i} className="bg-slate-600 rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <p className="text-white font-semibold">{item.itemId?.name || 'Unknown'}</p>
                      <p className="text-slate-400 text-sm">Equipment Rental</p>
                    </div>
                    <div className="text-right">
                      <span className="bg-slate-500 text-white px-3 py-1 rounded text-sm font-medium">
                        Qty: {item.quantity}
                      </span>
                      <p className="text-green-400 text-sm font-semibold mt-1">
                        Rs. {item.dailyRate}/day
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT — Cost Summary & Return Button */}
          <div>
            <div className="bg-slate-700 rounded-xl p-6 shadow-xl sticky top-6 space-y-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <DollarSign className="text-yellow-400" size={22} /> Cost Calculation
              </h3>

              {/* Days rented */}
              <div className="bg-slate-600 rounded-lg p-4 border border-slate-500">
                <p className="text-slate-400 text-sm mb-1">Days Rented</p>
                <p className="text-white text-2xl font-bold">{daysRented} days</p>
                <p className="text-slate-500 text-xs mt-1">
                  From {formatDate(rentalData.rentDate)} to today
                </p>
              </div>

              {/* Subtotal */}
              <div className="bg-slate-600 rounded-lg p-3 flex justify-between">
                <span className="text-slate-400 text-sm">Subtotal</span>
                <span className="text-white font-semibold">{formatCurrency(totalCost)}</span>
              </div>

              {/* Advance paid */}
              <div className="bg-slate-600 rounded-lg p-3 flex justify-between">
                <span className="text-slate-400 text-sm">Advance Paid</span>
                <span className="text-green-400 font-semibold">
                  -{formatCurrency(rentalData.advancePayment || 0)}
                </span>
              </div>

              {/* Final amount */}
              <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-lg p-4 border-2 border-orange-400">
                <p className="text-slate-100 text-sm mb-1">Final Amount Due</p>
                <p className="text-white text-3xl font-bold">{formatCurrency(finalAmountDue)}</p>
                {finalAmountDue === 0 && (
                  <p className="text-green-300 text-sm mt-1">✓ Fully paid with advance</p>
                )}
              </div>

              {/* Error inside panel */}
              {searchError && (
                <div className="bg-red-500/10 border border-red-500 rounded-lg p-3 flex gap-2">
                  <AlertCircle className="text-red-400 flex-shrink-0" size={16} />
                  <p className="text-red-300 text-sm">{searchError}</p>
                </div>
              )}

              {/* Confirm Return button */}
              <button
                onClick={handleConfirmReturn}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg font-bold transition transform hover:scale-105"
              >
                {isProcessing ? (
                  <><Loader className="animate-spin" size={20} /> Processing…</>
                ) : (
                  <><CheckCircle size={20} /> Confirm Return</>
                )}
              </button>
              <p className="text-slate-500 text-xs text-center">
                This will mark the rental as returned and restore inventory stock.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Empty State ──────────────────────────────────────────────────── */}
      {!rentalData && !results.length && !searchError && (
        <div className="text-center py-16">
          <Package className="mx-auto text-slate-600 mb-4" size={52} />
          <p className="text-slate-400 text-lg">Search for a rental to begin processing returns</p>
          <p className="text-slate-600 text-sm mt-2">
            Use the Agreement Token or the customer's NIC number
          </p>
        </div>
      )}
    </div>
  );
};

export default Returns;
