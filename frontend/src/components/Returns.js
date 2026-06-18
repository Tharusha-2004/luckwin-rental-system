/**
 * Returns Component
 * Search active rentals by Agreement Token OR Customer NIC.
 * Process returns and view/download return receipts.
 */

import React, { useState, useRef, useEffect } from 'react';
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
  FileCheck,
  Download,
  X,
  Trash2
} from 'lucide-react';
import { formatDate, formatCurrency, calculateDaysDifference } from '../utils/helpers';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const Returns = () => {
  // ── Search & Tab state ───────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('process'); // 'process' | 'history'
  const [historyRentals, setHistoryRentals] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  // ── Results state ─────────────────────────────────────────────────────────
  const [results, setResults] = useState([]);
  const [searchType, setSearchType] = useState(''); // 'token' | 'nic'

  // ── Selected rental for processing ───────────────────────────────────────
  const [rentalData, setRentalData] = useState(null);

  // ── Return processing state ───────────────────────────────────────────────
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // ── Receipt Modal State ──────────────────────────────────────────────────
  const [viewingReceipt, setViewingReceipt] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const receiptRef = useRef(null);

  // ── Settle & Return Modal State ──────────────────────────────────────────
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);

  // ── Fetch History ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      const response = await apiClient.get('/rentals', { params: { status: 'Returned' } });
      if (response.data.success) {
        setHistoryRentals(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching return history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleDeleteHistory = async (id) => {
    if (!window.confirm("Are you sure you want to delete this return record?")) return;
    try {
      const response = await apiClient.delete(`/rentals/${id}`);
      if (response.data.success) {
        setHistoryRentals(historyRentals.filter(r => r._id !== id));
      }
    } catch (err) {
      alert('Failed to delete record.');
    }
  };

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
      const response = await apiClient.get(`/rentals/search/${encodeURIComponent(query)}`);

      if (response.data.success) {
        const data = response.data.data;
        setSearchType(response.data.searchType);

        if (data.length === 1) {
          setRentalData(data[0]);
        } else {
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

  const handleSelectRental = (rental) => {
    setResults([]);
    setRentalData(rental);
  };

  const handleReset = () => {
    setRentalData(null);
    setResults([]);
    setSearchError('');
    setSearchInput('');
    setShowSuccessMessage(false);
    setViewingReceipt(null);
  };

  // ── Cost helpers ──────────────────────────────────────────────────────────
  const calculateDaysRented = (rental) => {
    if (!rental) return 0;
    const end = rental.status === 'Returned' && rental.actualReturnDate
      ? rental.actualReturnDate
      : new Date().toISOString().split('T')[0];
    return Math.max(1, calculateDaysDifference(rental.rentDate, end));
  };

  const calculateTotalCost = (rental) => {
    if (!rental) return 0;
    // If returned, totalCost is already recalculated by backend
    if (rental.status === 'Returned' && rental.totalCost !== undefined) {
      return rental.totalCost;
    }
    const days = calculateDaysRented(rental);
    return rental.rentedItems?.reduce(
      (sum, item) => sum + item.quantity * item.dailyRate * days,
      0
    ) || 0;
  };

  const daysRented = rentalData ? calculateDaysRented(rentalData) : 0;
  const totalCost = rentalData ? calculateTotalCost(rentalData) : 0;
  const advancePaid = rentalData?.advancePayment || 0;
  const balance = totalCost - advancePaid;

  // ── Confirm return ────────────────────────────────────────────────────────
  const handleConfirmReturn = async () => {
    if (!rentalData?._id) return;
    try {
      setIsProcessing(true);
      setSearchError('');

      const response = await apiClient.post(`/rentals/${rentalData._id}/return`, {
        actualReturnDate: new Date().toISOString().split('T')[0],
        manualDiscount: discountAmount,
      });

      if (response.data.success) {
        setShowSuccessMessage(true);
        const returnedRental = response.data.data;

        // Force the final calculation for the receipt view instantly
        const updatedReceiptData = {
          ...returnedRental,
          manualDiscount: discountAmount,
          finalSettledAmount: (totalCost - advancePaid - discountAmount)
        };

        setRentalData(updatedReceiptData);
        setShowSettleModal(false);
        // Auto-open the receipt modal
        setViewingReceipt(updatedReceiptData);
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

  // ── PDF Download Logic ─────────────────────────────────────────────────────
  const handleDownloadPDF = async () => {
    if (!receiptRef.current || pdfLoading) return;
    try {
      setPdfLoading(true);
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidthMM = pageWidth;
      const imgHeightMM = (canvas.height / canvas.width) * imgWidthMM;

      let yOffset = 0;
      while (yOffset < imgHeightMM) {
        if (yOffset > 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, -yOffset, imgWidthMM, imgHeightMM);
        yOffset += pageHeight;
      }
      const token = viewingReceipt?.agreementToken?.slice(0, 8) || 'Return';
      pdf.save(`Luckwin_Return_Receipt_${token}.pdf`);
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setPdfLoading(false);
    }
  };

  const closeReceiptModal = () => {
    setViewingReceipt(null);
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">

      {/* ── Page Header & Tabs ──────────────────────────────────────────── */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Package className="text-green-400" size={32} />
            <h1 className="text-4xl font-bold text-white">Equipment Returns</h1>
          </div>
          <p className="text-slate-400">
            Process returns or view return history
          </p>
        </div>

        {/* ── Tabs ──────────────────────────────────────────────────────── */}
        <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700 w-fit">
          <button
            onClick={() => setActiveTab('process')}
            className={`px-6 py-2.5 rounded-md font-semibold text-sm transition-all ${activeTab === 'process'
                ? 'bg-slate-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            Process Returns
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-2.5 rounded-md font-semibold text-sm transition-all ${activeTab === 'history'
                ? 'bg-slate-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            Return History
          </button>
        </div>
      </div>

      {activeTab === 'history' ? (
        // ── RETURN HISTORY TAB ─────────────────────────────────────────────
        <div className="bg-slate-700 rounded-xl p-6 shadow-xl border border-slate-600">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Clock size={22} /> Return History
          </h2>

          {historyLoading ? (
            <div className="flex justify-center py-12">
              <Loader className="animate-spin text-green-400" size={40} />
            </div>
          ) : historyRentals.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400 text-lg">No return history found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-600 text-slate-300">
                    <th className="pb-3 px-4 font-semibold">Customer Name</th>
                    <th className="pb-3 px-4 font-semibold">NIC</th>
                    <th className="pb-3 px-4 font-semibold">Rent Date</th>
                    <th className="pb-3 px-4 font-semibold">Returned Date</th>
                    <th className="pb-3 px-4 font-semibold">Final Settled</th>
                    <th className="pb-3 px-4 text-center font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-600/50">
                  {historyRentals.map((rental) => (
                    <tr key={rental._id} className="hover:bg-slate-600/30 transition-colors">
                      <td className="py-4 px-4 text-white font-medium">{rental.customerId?.name || 'Unknown'}</td>
                      <td className="py-4 px-4 text-slate-300">{rental.customerId?.nic || 'N/A'}</td>
                      <td className="py-4 px-4 text-slate-300">{formatDate(rental.rentDate)}</td>
                      <td className="py-4 px-4 text-slate-300">{formatDate(rental.actualReturnDate)}</td>
                      <td className="py-4 px-4 text-green-400 font-semibold">{formatCurrency(rental.finalAmount)}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setViewingReceipt(rental)}
                            className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
                            title="View Receipt"
                          >
                            <FileCheck size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteHistory(rental._id)}
                            className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                            title="Delete Record"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        // ── PROCESS RETURNS TAB (Original UI) ──────────────────────────────
        <>
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
                  const isReturned = rental.status === 'Returned';

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
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${isReturned
                              ? 'bg-green-500/20 text-green-300 border border-green-500/40'
                              : isOverdue
                                ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                                : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
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
                      <div className="ml-4 flex items-center gap-2 flex-shrink-0 transition-colors">
                        {isReturned ? (
                          <div className="text-teal-400 group-hover:text-teal-300 flex items-center gap-1">
                            <span className="text-sm font-semibold hidden sm:block">View Receipt</span>
                            <ChevronRight size={20} />
                          </div>
                        ) : (
                          <div className="text-green-400 group-hover:text-green-300 flex items-center gap-1">
                            <span className="text-sm font-semibold hidden sm:block">Process Return</span>
                            <ChevronRight size={20} />
                          </div>
                        )}
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
                      { label: 'Name', value: rentalData.customerId?.name },
                      { label: 'Phone', value: rentalData.customerId?.phone },
                      { label: 'NIC', value: rentalData.customerId?.nic },
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
                        className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mt-0.5 ${rentalData.status === 'Returned'
                          ? 'bg-green-500/30 text-green-300'
                          : rentalData.status === 'Overdue'
                            ? 'bg-red-500/30 text-red-300'
                            : 'bg-blue-500/30 text-blue-300'
                          }`}
                      >
                        {rentalData.status}
                      </span>
                    </div>
                    {rentalData.actualReturnDate && (
                      <div>
                        <p className="text-slate-400 text-sm">Actual Return</p>
                        <p className="text-white font-semibold">{formatDate(rentalData.actualReturnDate)}</p>
                      </div>
                    )}
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
                      From {formatDate(rentalData.rentDate)} to {rentalData.status === 'Returned' && rentalData.actualReturnDate ? formatDate(rentalData.actualReturnDate) : 'today'}
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
                      -{formatCurrency(advancePaid)}
                    </span>
                  </div>

                  {/* ── Final Balance: 3 scenarios ───────────────────────────── */}
                  {balance > 0 && (
                    // Scenario 1: Customer still owes money
                    <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-lg p-4 border-2 border-orange-400">
                      <p className="text-slate-100 text-sm mb-1">Final Amount Due</p>
                      <p className="text-white text-3xl font-bold">{formatCurrency(balance)}</p>
                      <p className="text-orange-200 text-xs mt-1">
                        {rentalData.status === 'Returned' ? 'Collected from customer on return' : 'Collect from customer on return'}
                      </p>
                    </div>
                  )}

                  {balance === 0 && (
                    // Scenario 2: Perfect match — nothing to collect or refund
                    <div className="bg-gradient-to-r from-emerald-700 to-green-700 rounded-lg p-4 border-2 border-emerald-400">
                      <p className="text-emerald-100 text-sm mb-1">Fully Settled</p>
                      <p className="text-white text-3xl font-bold">{formatCurrency(0)}</p>
                      <p className="text-emerald-200 text-xs mt-1">✓ Advance exactly covers the total</p>
                    </div>
                  )}

                  {balance < 0 && (
                    // Scenario 3: Advance exceeded total — refund the customer
                    <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-lg p-4 border-2 border-green-300">
                      <p className="text-green-100 text-sm mb-1 font-semibold">Refund to Customer</p>
                      <p className="text-white text-3xl font-bold">{formatCurrency(Math.abs(balance))}</p>
                      <p className="text-green-100 text-xs mt-1">
                        {rentalData.status === 'Returned' ? 'Excess advance refunded' : 'Excess advance to be returned.'}
                      </p>
                    </div>
                  )}

                  {/* Error inside panel */}
                  {searchError && (
                    <div className="bg-red-500/10 border border-red-500 rounded-lg p-3 flex gap-2">
                      <AlertCircle className="text-red-400 flex-shrink-0" size={16} />
                      <p className="text-red-300 text-sm">{searchError}</p>
                    </div>
                  )}

                  {/* CTA Button based on status */}
                  {rentalData.status === 'Returned' ? (
                    <button
                      onClick={() => setViewingReceipt(rentalData)}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white px-4 py-3 rounded-lg font-bold transition transform hover:scale-105"
                    >
                      <FileCheck size={20} /> View Return Receipt
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setDiscountAmount(0);
                          setShowSettleModal(true);
                        }}
                        disabled={isProcessing}
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg font-bold transition transform hover:scale-105"
                      >
                        <CheckCircle size={20} /> Process Return
                      </button>
                      <p className="text-slate-500 text-xs text-center">
                        This will mark the rental as returned and restore inventory stock.
                      </p>
                    </>
                  )}
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
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          RETURN RECEIPT MODAL
      ══════════════════════════════════════════════════════════════════════ */}
          {viewingReceipt && (
            <div
              className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto"
              style={{ backgroundColor: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(5px)' }}
              onClick={(e) => { if (e.target === e.currentTarget) closeReceiptModal(); }}
            >
              <div className="w-full max-w-lg my-8 rounded-2xl shadow-2xl overflow-hidden">
                {/* ── Receipt Content (Captured by html2canvas) ── */}
                <div ref={receiptRef} className="bg-white text-gray-800 p-8 font-sans">

                  {/* Header */}
                  <div className="text-center border-b-2 border-gray-300 pb-5 mb-5">
                    <p className="text-3xl font-black tracking-widest text-gray-900">🏗️ LUCKWIN STORES</p>
                    <p className="text-sm text-gray-500 mt-1 font-medium tracking-wide uppercase">
                      Return & Settlement Receipt
                    </p>
                  </div>

                  {/* Agreement Token & Info */}
                  <div className="mb-5 pb-4 border-b border-dashed border-gray-300">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider">Agreement Token</p>
                        <p className="font-mono font-bold text-gray-900 text-sm mt-0.5 break-all">
                          {viewingReceipt.agreementToken}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">
                          Returned
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Customer</p>
                        <p className="font-bold text-gray-900">{viewingReceipt.customerId?.name || 'N/A'}</p>
                        <p className="text-sm text-gray-600">{viewingReceipt.customerId?.phone || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Dates</p>
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Rented:</span> {formatDate(viewingReceipt.rentDate)}
                        </p>
                        <p className="text-sm text-gray-700 mt-0.5">
                          <span className="font-medium">Returned:</span> {formatDate(viewingReceipt.actualReturnDate || new Date())}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Items Table */}
                  <div className="mb-5 pb-4 border-b border-dashed border-gray-300">
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Returned Items</p>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left pb-2 text-gray-600 font-semibold">Item</th>
                          <th className="text-center pb-2 text-gray-600 font-semibold">Qty</th>
                          <th className="text-right pb-2 text-gray-600 font-semibold">Rate</th>
                          <th className="text-right pb-2 text-gray-600 font-semibold">Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewingReceipt.rentedItems?.map((item, idx) => {
                          const days = calculateDaysRented(viewingReceipt);
                          const cost = item.quantity * item.dailyRate * days;
                          return (
                            <tr key={idx} className="border-b border-gray-100">
                              <td className="py-2 text-gray-800 font-medium">{item.itemId?.name || 'Item'}</td>
                              <td className="py-2 text-center text-gray-600">{item.quantity}</td>
                              <td className="py-2 text-right text-gray-600">{formatCurrency(item.dailyRate)}</td>
                              <td className="py-2 text-right font-semibold text-gray-800">{formatCurrency(cost)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Financial Settlement */}
                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Subtotal ({calculateDaysRented(viewingReceipt)} days)</span>
                      <span className="font-semibold">{formatCurrency(calculateTotalCost(viewingReceipt))}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Advance Paid</span>
                      <span className="font-semibold text-green-600">− {formatCurrency(viewingReceipt.advancePayment || 0)}</span>
                    </div>

                    {viewingReceipt.manualDiscount > 0 && (
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-gray-600">Discount</span>
                        <span className="font-semibold text-green-600">− {formatCurrency(viewingReceipt.manualDiscount)}</span>
                      </div>
                    )}

                    {(() => {
                      const receiptSubtotal = calculateTotalCost(viewingReceipt);
                      const receiptAdvance = viewingReceipt.advancePayment || 0;
                      const receiptDiscount = viewingReceipt.manualDiscount || viewingReceipt.discountAmount || 0;
                      const receiptBalance = viewingReceipt.finalSettledAmount !== undefined
                        ? viewingReceipt.finalSettledAmount
                        : (receiptSubtotal - receiptAdvance - receiptDiscount);

                      return (
                        <div className={`flex justify-between items-center p-3 rounded-lg mt-3 ${receiptBalance > 0 ? 'bg-gray-100 border border-gray-300'
                          : receiptBalance < 0 ? 'bg-teal-50 border border-teal-200'
                            : 'bg-green-50 border border-green-200'
                          }`}>
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-800">
                              {receiptBalance > 0 ? 'Balance Paid by Customer' : receiptBalance < 0 ? 'Refund Given to Customer' : 'Fully Settled'}
                            </span>
                            <span className="text-xs text-gray-500 mt-0.5">Final Settled Amount</span>
                          </div>
                          <span className={`font-black text-xl ${receiptBalance > 0 ? 'text-gray-800'
                            : receiptBalance < 0 ? 'text-teal-600'
                              : 'text-green-600'
                            }`}>
                            {receiptBalance === 0 ? '✓ Rs. 0.00' : formatCurrency(Math.abs(receiptBalance))}
                          </span>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Footer */}
                  <div className="text-center text-xs text-gray-400 border-t border-gray-200 pt-4">
                    <p className="font-semibold text-gray-600 mb-0.5">Thank you for choosing Luckwin Stores!</p>
                    <p>Returns & Settlement Processed Successfully</p>
                    <p className="mt-1">Generated: {new Date().toLocaleString('en-GB')}</p>
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="bg-gray-900 border-t border-gray-700 px-6 py-4 flex gap-3">
                  <button
                    onClick={closeReceiptModal}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white transition-all font-medium text-sm"
                  >
                    Close
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    disabled={pdfLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:bg-teal-600/50 disabled:cursor-not-allowed text-white font-bold text-sm transition-all shadow-lg shadow-teal-500/20"
                  >
                    {pdfLoading
                      ? <><Loader size={15} className="animate-spin" /> Generating…</>
                      : <><Download size={15} /> Download as PDF</>
                    }
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
          SETTLE & RETURN MODAL
      ══════════════════════════════════════════════════════════════════════ */}
          {showSettleModal && rentalData && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
              style={{ backgroundColor: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(5px)' }}
              onClick={(e) => { if (e.target === e.currentTarget) setShowSettleModal(false); }}
            >
              <div className="bg-slate-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-700">
                <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center bg-slate-800">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <CheckCircle className="text-green-400" size={24} /> Settle & Return
                  </h2>
                  <button onClick={() => setShowSettleModal(false)} className="text-slate-400 hover:text-white transition">
                    <X size={24} />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <div className="bg-slate-700 rounded-lg p-4 border border-slate-600">
                    <div className="flex justify-between text-slate-300 mb-2">
                      <span>Subtotal:</span>
                      <span className="text-white font-semibold">{formatCurrency(totalCost)}</span>
                    </div>
                    <div className="flex justify-between text-slate-300 mb-4">
                      <span>Advance Paid:</span>
                      <span className="text-green-400">-{formatCurrency(advancePaid)}</span>
                    </div>

                    <div className="pt-4 border-t border-slate-600">
                      <label className="block text-slate-300 font-medium mb-2 text-sm">Manual Discount (Rs.)</label>
                      <input
                        type="number"
                        min="0"
                        max={totalCost}
                        value={discountAmount}
                        onChange={(e) => setDiscountAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full px-4 py-2 rounded-lg bg-slate-600 text-white border border-slate-500 focus:border-blue-400 focus:outline-none transition"
                      />
                    </div>
                  </div>

                  {(() => {
                    const settleBalance = totalCost - discountAmount - advancePaid;
                    return (
                      <div className={`rounded-lg p-4 border-2 ${settleBalance > 0 ? 'bg-orange-600/20 border-orange-500/50'
                        : settleBalance < 0 ? 'bg-teal-500/20 border-teal-500/50'
                          : 'bg-green-500/20 border-green-500/50'
                        }`}>
                        <p className={`text-sm mb-1 ${settleBalance > 0 ? 'text-orange-300'
                          : settleBalance < 0 ? 'text-teal-300'
                            : 'text-green-300'
                          }`}>
                          {settleBalance > 0 ? 'Amount Due from Customer' : settleBalance < 0 ? 'Refund to Customer' : 'Fully Settled'}
                        </p>
                        <p className="text-white text-3xl font-bold">{formatCurrency(Math.abs(settleBalance))}</p>
                      </div>
                    );
                  })()}
                </div>

                <div className="bg-slate-900 px-6 py-4 flex gap-3">
                  <button
                    onClick={() => setShowSettleModal(false)}
                    className="flex-1 px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmReturn}
                    disabled={isProcessing}
                    className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-2 rounded-lg font-bold transition disabled:opacity-50"
                  >
                    {isProcessing ? <><Loader className="animate-spin" size={18} /> Processing…</> : 'Confirm Return'}
                  </button>
                </div>
              </div>
            </div>
          )}

    </div>
  );
};

export default Returns;
