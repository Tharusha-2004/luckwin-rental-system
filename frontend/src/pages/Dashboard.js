/**
 * Dashboard Page Component
 * - Active Rentals table with "Edit Bill" (yellow) and "View Bill" (blue) action buttons
 * - Edit Modal: dark-themed form to update rental items/dates/advance
 * - Bill Modal: white paper-style receipt with Download PDF button
 */

import React, { useState, useEffect, useRef } from 'react';
import { rentalsAPI, itemsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import SuccessAlert from '../components/SuccessAlert';
import { formatDate, formatCurrency, calculateDaysDifference } from '../utils/helpers';
import {
  AlertCircle, TrendingUp, AlertTriangle, Package,
  Edit, X, Plus, Loader, Save, FileText, Download,
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const toDateInput = (iso) => (iso ? iso.split('T')[0] : '');

const Dashboard = () => {
  // ── Dashboard data ─────────────────────────────────────────────────────────
  const [activeRentals, setActiveRentals] = useState([]);
  const [overdueRentals, setOverdueRentals] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ── Edit modal state ───────────────────────────────────────────────────────
  const [editingRental, setEditingRental] = useState(null);
  const [editItems, setEditItems] = useState([]);
  const [editReturnDate, setEditReturnDate] = useState('');
  const [editAdvance, setEditAdvance] = useState(0);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');

  // ── Bill (View) modal state ────────────────────────────────────────────────
  const [viewingRental, setViewingRental] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const billRef = useRef(null);

  useEffect(() => {
    fetchDashboardData();
    fetchAllItems();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  // ── Data fetchers ──────────────────────────────────────────────────────────
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [activeRes, overdueRes, lowStockRes] = await Promise.all([
        rentalsAPI.getActive(),
        rentalsAPI.getOverdue(),
        itemsAPI.getLowStock(),
      ]);
      if (activeRes.data.success) setActiveRentals(activeRes.data.data);
      if (overdueRes.data.success) setOverdueRentals(overdueRes.data.data);
      if (lowStockRes.data.success) setLowStockItems(lowStockRes.data.data);
      setError('');
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllItems = async () => {
    try {
      const res = await itemsAPI.getAll();
      if (res.data.success) setAllItems(res.data.data);
    } catch (_) { }
  };

  // ── Edit modal logic ───────────────────────────────────────────────────────
  const openEditModal = (rental) => {
    setEditingRental(rental);
    setEditItems(
      rental.rentedItems.map((ri) => ({
        itemId: ri.itemId?._id || ri.itemId,
        name: ri.itemId?.name || 'Unknown',
        quantity: ri.quantity,
        dailyRate: ri.dailyRate,
      }))
    );
    setEditReturnDate(toDateInput(rental.expectedReturnDate));
    setEditAdvance(rental.advancePayment || 0);
    setEditError('');
  };

  const closeEditModal = () => { setEditingRental(null); setEditError(''); };

  const calcEditSubtotal = () => {
    if (!editReturnDate) return 0;
    const days = Math.max(1, calculateDaysDifference(new Date(), new Date(editReturnDate)));
    return editItems.reduce((sum, it) => {
      const itemData = allItems.find((i) => i._id === it.itemId);
      const rate = itemData?.dailyRate ?? it.dailyRate ?? 0;
      return sum + it.quantity * rate * days;
    }, 0);
  };

  const editSubtotal = calcEditSubtotal();
  const editBalance = editSubtotal - parseFloat(editAdvance || 0);

  const handleEditAddItem = () => setEditItems([...editItems, { itemId: '', name: '', quantity: 1, dailyRate: 0 }]);
  const handleEditRemoveItem = (i) => setEditItems(editItems.filter((_, idx) => idx !== i));
  const handleEditItemChange = (i, field, value) => {
    const updated = [...editItems];
    if (field === 'itemId') {
      const found = allItems.find((itm) => itm._id === value);
      updated[i] = { ...updated[i], itemId: value, name: found?.name || '', dailyRate: found?.dailyRate || 0 };
    } else {
      updated[i] = { ...updated[i], [field]: value };
    }
    setEditItems(updated);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editReturnDate || editItems.length === 0 || editItems.some((it) => !it.itemId)) {
      setEditError('Please fill in all fields and select valid items.');
      return;
    }
    try {
      setEditSubmitting(true);
      setEditError('');
      const payload = {
        rentedItems: editItems.map((i) => ({ item: i.itemId, itemId: i.itemId, quantity: Number(i.quantity) })),
        subtotal: editSubtotal,
        advancePaid: parseFloat(editAdvance || 0),
      };
      const res = await rentalsAPI.update(editingRental._id, payload);
      if (res.data.success) {
        setSuccess('Rental updated successfully!');
        closeEditModal();
        fetchDashboardData();
      } else {
        setEditError(res.data.error || 'Update failed.');
      }
    } catch (err) {
      setEditError(err.response?.data?.error || err.response?.data?.message || 'Failed to update rental.');
    } finally {
      setEditSubmitting(false);
    }
  };

  // ── Bill (View) modal logic ────────────────────────────────────────────────
  const openBillModal = (rental) => setViewingRental(rental);
  const closeBillModal = () => setViewingRental(null);

  // Compute bill financials from the raw rental document
  const getBillSummary = (rental) => {
    if (!rental) return { subtotal: 0, advance: 0, balance: 0 };
    const subtotal = rental.totalCost || 0;
    const advance = rental.advancePayment || 0;
    return { subtotal, advance, balance: subtotal - advance };
  };

  const handleDownloadPDF = async () => {
    if (!billRef.current || pdfLoading) return;
    try {
      setPdfLoading(true);
      const canvas = await html2canvas(billRef.current, {
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
      const token = viewingRental?.agreementToken?.slice(0, 8) || 'bill';
      pdf.save(`Luckwin_Bill_${token}.pdf`);
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setPdfLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) return <LoadingSpinner />;

  const statsCards = [
    { title: 'Active Rentals', value: activeRentals.length, icon: TrendingUp, color: 'blue' },
    { title: 'Overdue Items', value: overdueRentals.length, icon: AlertTriangle, color: 'red' },
    { title: 'Low Stock Items', value: lowStockItems.length, icon: Package, color: 'yellow' },
  ];

  const bill = getBillSummary(viewingRental);

  return (
    <div className="p-6">
      {error && <ErrorAlert message={error} onClose={() => setError('')} />}
      {success && <SuccessAlert message={success} onClose={() => setSuccess('')} />}

      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      {/* ── Stats Cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {statsCards.map((card, index) => {
          const Icon = card.icon;
          const colors = {
            blue: 'bg-blue-50 text-blue-600 border-blue-200',
            red: 'bg-red-50 text-red-600 border-red-200',
            yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
          };
          return (
            <div key={index} className={`border-l-4 rounded-lg p-6 ${colors[card.color]}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold opacity-75">{card.title}</p>
                  <p className="text-3xl font-bold mt-2">{card.value}</p>
                </div>
                <Icon size={40} className="opacity-20" />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Active Rentals Table ──────────────────────────────────────────── */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Active Rentals</h2>
        </div>
        <div className="overflow-x-auto">
          {activeRentals.length > 0 ? (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Token</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Customer</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Rent Date</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Due Date</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Total Cost</th>
                  <th className="px-6 py-3 text-center font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {activeRentals.slice(0, 5).map((rental) => (
                  <tr key={rental._id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-mono text-xs text-blue-600">
                      {rental.agreementToken.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-3">
                      {rental.customerId?.name || <span className="italic text-gray-400">Deleted Customer</span>}
                    </td>
                    <td className="px-6 py-3">{formatDate(rental.rentDate)}</td>
                    <td className="px-6 py-3">{formatDate(rental.expectedReturnDate)}</td>
                    <td className="px-6 py-3 font-semibold">{formatCurrency(rental.totalCost)}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center justify-center gap-2">
                        {/* View Bill */}
                        <button
                          onClick={() => openBillModal(rental)}
                          title="View Bill"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 hover:text-blue-700 transition-colors"
                        >
                          <FileText size={13} /> View Bill
                        </button>
                        {/* Edit Bill */}
                        <button
                          onClick={() => openEditModal(rental)}
                          title="Edit Bill"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-yellow-600 bg-yellow-50 border border-yellow-200 hover:bg-yellow-100 hover:text-yellow-700 transition-colors"
                        >
                          <Edit size={13} /> Edit Bill
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-6 text-center text-gray-500">No active rentals</div>
          )}
        </div>
      </div>

      {/* ── Overdue Rentals Alert ─────────────────────────────────────────── */}
      {overdueRentals.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-600 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-4">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-1" size={24} />
            <div>
              <h3 className="text-lg font-semibold text-red-900 mb-2">Overdue Rentals</h3>
              <p className="text-red-700 mb-4">
                {overdueRentals.length} rental{overdueRentals.length !== 1 ? 's' : ''} are overdue for return.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {overdueRentals.slice(0, 4).map((rental) => (
                  <div key={rental._id} className="bg-white rounded p-3 border border-red-200">
                    <p className="font-semibold text-gray-900">
                      {rental.customerId?.name || <span className="italic text-gray-400">Deleted Customer</span>}
                    </p>
                    <p className="text-sm text-gray-600">Due: {formatDate(rental.expectedReturnDate)}</p>
                    <p className="text-sm text-red-600 font-semibold">{rental.customerId?.phone || '—'}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Low Stock Items ───────────────────────────────────────────────── */}
      {lowStockItems.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-600 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-1" size={24} />
            <div className="w-full">
              <h3 className="text-lg font-semibold text-yellow-900 mb-2">Low Stock Items</h3>
              <p className="text-yellow-700 mb-4">
                {lowStockItems.length} item{lowStockItems.length !== 1 ? 's' : ''} have low stock levels.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lowStockItems.slice(0, 4).map((item) => (
                  <div key={item._id} className="bg-white rounded p-3 border border-yellow-200">
                    <p className="font-semibold text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-600">
                      Available: {item.availableQuantity} / {item.totalQuantity}
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-yellow-500 h-2 rounded-full"
                        style={{ width: `${(item.availableQuantity / item.totalQuantity) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          BILL (VIEW) MODAL — white paper receipt + PDF download
      ══════════════════════════════════════════════════════════════════════ */}
      {viewingRental && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto"
          style={{ backgroundColor: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(5px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) closeBillModal(); }}
        >
          <div className="w-full max-w-lg my-8 rounded-2xl shadow-2xl overflow-hidden">

            {/* ── Receipt (white paper area — this is what html2canvas captures) ── */}
            <div ref={billRef} className="bg-white text-gray-800 p-8 font-sans">

              {/* Header */}
              <div className="text-center border-b-2 border-gray-300 pb-5 mb-5">
                <p className="text-3xl font-black tracking-widest text-gray-900">🏗️ LUCKWIN STORES</p>
                <p className="text-sm text-gray-500 mt-1 font-medium tracking-wide">
                  Equipment Rental Agreement
                </p>
                <p className="text-xs text-gray-400 mt-0.5">Professional Equipment Rental Services</p>
              </div>

              {/* Agreement Token + Status */}
              <div className="flex justify-between items-start mb-5 pb-4 border-b border-dashed border-gray-300">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Agreement Token</p>
                  <p className="font-mono font-bold text-blue-700 text-sm mt-0.5 break-all">
                    {viewingRental.agreementToken}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Status</p>
                  <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-xs font-bold ${viewingRental.status === 'Returned' ? 'bg-green-100 text-green-700'
                      : viewingRental.status === 'Overdue' ? 'bg-red-100 text-red-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                    {viewingRental.status}
                  </span>
                </div>
              </div>

              {/* Customer + Dates — 2 column */}
              <div className="grid grid-cols-2 gap-4 mb-5 pb-4 border-b border-dashed border-gray-300">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Customer</p>
                  <p className="font-bold text-gray-900">{viewingRental.customerId?.name || 'N/A'}</p>
                  <p className="text-sm text-gray-600">{viewingRental.customerId?.phone || '—'}</p>
                  {viewingRental.customerId?.nic && (
                    <p className="text-xs text-gray-400 mt-0.5">NIC: {viewingRental.customerId.nic}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Dates</p>
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Rented:</span> {formatDate(viewingRental.rentDate)}
                  </p>
                  <p className="text-sm text-gray-700 mt-0.5">
                    <span className="font-semibold">Due:</span> {formatDate(viewingRental.expectedReturnDate)}
                  </p>
                </div>
              </div>

              {/* Items Table */}
              <div className="mb-5 pb-4 border-b border-dashed border-gray-300">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Rented Items</p>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left pb-2 text-gray-600 font-semibold">Item</th>
                      <th className="text-center pb-2 text-gray-600 font-semibold">Qty</th>
                      <th className="text-right pb-2 text-gray-600 font-semibold">Rate/Day</th>
                      <th className="text-right pb-2 text-gray-600 font-semibold">Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingRental.rentedItems?.map((item, idx) => {
                      const days = Math.max(1, calculateDaysDifference(
                        viewingRental.rentDate, viewingRental.expectedReturnDate
                      ));
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

              {/* Financial Summary */}
              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-semibold">{formatCurrency(bill.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Advance Paid</span>
                  <span className="font-semibold text-green-600">− {formatCurrency(bill.advance)}</span>
                </div>
                <div className={`flex justify-between items-center p-3 rounded-lg mt-2 ${bill.balance > 0 ? 'bg-red-50 border border-red-200'
                    : bill.balance < 0 ? 'bg-teal-50 border border-teal-200'
                      : 'bg-green-50 border border-green-200'
                  }`}>
                  <span className="font-bold text-gray-800">
                    {bill.balance > 0 ? 'Balance Due' : bill.balance < 0 ? 'Refund' : 'Fully Settled'}
                  </span>
                  <span className={`font-black text-xl ${bill.balance > 0 ? 'text-red-600'
                      : bill.balance < 0 ? 'text-teal-600'
                        : 'text-green-600'
                    }`}>
                    {bill.balance === 0 ? '✓ Rs. 0.00' : formatCurrency(Math.abs(bill.balance))}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center text-xs text-gray-400 border-t border-gray-200 pt-4">
                <p className="font-semibold text-gray-600 mb-0.5">Thank you for choosing Luckwin Stores!</p>
                <p>Equipment Rental Professionals Since 2024</p>
                <p className="mt-1">Printed: {new Date().toLocaleString('en-GB')}</p>
              </div>
            </div>
            {/* ── End receipt area ── */}

            {/* Modal action buttons (outside receipt, NOT captured in PDF) */}
            <div className="bg-gray-900 border-t border-gray-700 px-6 py-4 flex gap-3">
              <button
                onClick={closeBillModal}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white transition-all font-medium text-sm"
              >
                Close
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={pdfLoading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white font-bold text-sm transition-all shadow-lg shadow-blue-500/20"
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
          EDIT RENTAL MODAL — dark-themed form
      ══════════════════════════════════════════════════════════════════════ */}
      {editingRental && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto"
          style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) closeEditModal(); }}
        >
          <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-2xl my-8">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg border border-yellow-500/30">
                  <Edit className="text-yellow-400" size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Edit Rental Agreement</h3>
                  <p className="text-gray-400 text-xs mt-0.5 font-mono">
                    {editingRental.agreementToken?.slice(0, 16)}…
                  </p>
                </div>
              </div>
              <button onClick={closeEditModal} className="p-2 text-gray-500 hover:text-white hover:bg-gray-700 rounded-lg transition-all">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="px-6 py-5 space-y-6">

              {/* Customer (read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Customer</label>
                <div className="px-4 py-2.5 rounded-xl bg-gray-900/60 border border-gray-600 text-gray-400 text-sm cursor-not-allowed">
                  {editingRental.customerId?.name || 'Deleted Customer'}
                  {editingRental.customerId?.phone && (
                    <span className="ml-2 text-gray-500">({editingRental.customerId.phone})</span>
                  )}
                </div>
              </div>

              {/* Return Date */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Expected Return Date <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={editReturnDate}
                  onChange={(e) => setEditReturnDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-900 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-300">
                    Rented Items <span className="text-red-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleEditAddItem}
                    className="flex items-center gap-1 text-xs text-yellow-400 hover:text-yellow-300 border border-yellow-500/40 px-2.5 py-1 rounded-lg transition-all"
                  >
                    <Plus size={13} /> Add Item
                  </button>
                </div>
                <div className="space-y-3">
                  {editItems.map((it, i) => (
                    <div key={i} className="flex gap-3 items-end bg-gray-900/50 rounded-xl p-3 border border-gray-700">
                      <div className="flex-1">
                        <label className="text-xs text-gray-500 mb-1 block">Item</label>
                        <select
                          value={it.itemId}
                          onChange={(e) => handleEditItemChange(i, 'itemId', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all"
                        >
                          <option value="">— select item —</option>
                          {allItems.map((itm) => (
                            <option key={itm._id} value={itm._id}>
                              {itm.name} (avail: {itm.availableQuantity}) — Rs.{itm.dailyRate}/day
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="w-20">
                        <label className="text-xs text-gray-500 mb-1 block">Qty</label>
                        <input
                          type="number"
                          min="1"
                          value={it.quantity}
                          onChange={(e) => handleEditItemChange(i, 'quantity', parseInt(e.target.value) || 1)}
                          className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all"
                        />
                      </div>
                      <button type="button" onClick={() => handleEditRemoveItem(i)} className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  {editItems.length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-4">No items. Click "Add Item".</p>
                  )}
                </div>
              </div>

              {/* Advance Payment */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Advance Payment (Rs.)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editAdvance}
                  onChange={(e) => setEditAdvance(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-900 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Cost Summary */}
              {editReturnDate && editItems.length > 0 && (
                <div className="bg-gray-900/60 rounded-xl p-4 border border-gray-700 space-y-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Cost Summary</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Duration</span>
                    <span className="text-white font-medium">
                      {Math.max(1, calculateDaysDifference(new Date(), new Date(editReturnDate)))} days
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Total Cost</span>
                    <span className="text-white font-semibold">{formatCurrency(editSubtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Advance Paid</span>
                    <span className="text-green-400 font-semibold">− {formatCurrency(parseFloat(editAdvance || 0))}</span>
                  </div>
                  <div className="border-t border-gray-700 pt-2 flex justify-between">
                    <span className="text-gray-300 font-semibold">Balance</span>
                    <span className={`text-lg font-bold ${editBalance > 0 ? 'text-red-400' : editBalance < 0 ? 'text-teal-400' : 'text-emerald-400'}`}>
                      {editBalance > 0 ? `Due: ${formatCurrency(editBalance)}`
                        : editBalance < 0 ? `Refund: ${formatCurrency(Math.abs(editBalance))}`
                          : '✓ Fully Settled'}
                    </span>
                  </div>
                </div>
              )}

              {editError && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  <AlertCircle size={15} /> {editError}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={closeEditModal} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white transition-all font-medium text-sm">
                  Cancel
                </button>
                <button type="submit" disabled={editSubmitting} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 disabled:bg-yellow-500/50 disabled:cursor-not-allowed text-gray-900 font-bold text-sm transition-all shadow-lg shadow-yellow-500/20">
                  {editSubmitting ? <Loader size={15} className="animate-spin" /> : <Save size={15} />}
                  {editSubmitting ? 'Saving…' : 'Update Rental Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
