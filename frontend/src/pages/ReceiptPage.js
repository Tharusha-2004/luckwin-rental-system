/**
 * Public Receipt Page Component
 * Standalone page for digital rental receipt/invoice
 * Route: /receipt/:token
 */

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { receiptAPI } from '../services/api';
import { formatDate, formatCurrency, calculateDaysDifference } from '../utils/helpers';
import LoadingSpinner from './LoadingSpinner';
import ErrorAlert from './ErrorAlert';
import { Download, Print, AlertCircle } from 'lucide-react';

const ReceiptPage = () => {
  const { token } = useParams();
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReceipt();
  }, [token]);

  const fetchReceipt = async () => {
    try {
      setLoading(true);
      const response = await receiptAPI.getByToken(token);
      if (response.data.success) {
        setReceipt(response.data.data);
        setError('');
      } else {
        setError('Receipt not found');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load receipt');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // TODO: Implement PDF download functionality
    alert('PDF download feature coming soon');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <ErrorAlert message={error || 'Receipt not found'} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Print Header */}
        <div className="print:hidden mb-6 flex justify-end gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            <Print size={18} />
            Print
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            <Download size={18} />
            PDF
          </button>
        </div>

        {/* Receipt Container */}
        <div className="bg-white rounded-lg shadow-lg p-8 print:shadow-none">
          {/* Header */}
          <div className="border-b-2 border-gray-200 pb-6 mb-6">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-800">🏗️</h1>
              <h2 className="text-3xl font-bold text-gray-900 mt-2">LUCKWIN STORES</h2>
              <p className="text-gray-600 mt-1">Equipment Rental & Inventory Management</p>
              <p className="text-gray-500 text-sm mt-2">Professional Equipment Rental Services</p>
            </div>
          </div>

          {/* Agreement Info */}
          <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-gray-200">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Agreement Token</p>
              <p className="font-mono text-lg font-semibold text-gray-800">{receipt.agreementToken}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Status</p>
              <p
                className={`text-lg font-semibold ${
                  receipt.status === 'Returned'
                    ? 'text-green-600'
                    : receipt.status === 'Overdue'
                    ? 'text-red-600'
                    : 'text-blue-600'
                }`}
              >
                {receipt.status}
              </p>
            </div>
          </div>

          {/* Customer Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 pb-8 border-b border-gray-200">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase mb-4">Customer Information</h3>
              <div className="space-y-2 text-gray-700">
                <p>
                  <span className="font-semibold">Name:</span> {receipt.customer.name}
                </p>
                <p>
                  <span className="font-semibold">Phone:</span> {receipt.customer.phone}
                </p>
                <p>
                  <span className="font-semibold">NIC:</span> {receipt.customer.nic}
                </p>
                {receipt.customer.address && (
                  <p>
                    <span className="font-semibold">Address:</span> {receipt.customer.address}
                  </p>
                )}
                {receipt.customer.companyName && (
                  <p>
                    <span className="font-semibold">Company:</span> {receipt.customer.companyName}
                  </p>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase mb-4">Rental Dates</h3>
              <div className="space-y-2 text-gray-700">
                <p>
                  <span className="font-semibold">Rent Date:</span> {formatDate(receipt.rentDate)}
                </p>
                <p>
                  <span className="font-semibold">Expected Return:</span> {formatDate(receipt.expectedReturnDate)}
                </p>
                {receipt.actualReturnDate && (
                  <p>
                    <span className="font-semibold">Actual Return:</span> {formatDate(receipt.actualReturnDate)}
                  </p>
                )}
                <p className="text-blue-600 font-semibold">
                  Duration: {receipt.daysDaysRented} days
                </p>
              </div>
            </div>
          </div>

          {/* Rented Items Table */}
          <div className="mb-8 pb-8 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 uppercase mb-4">Rented Items</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="text-left py-2 px-3 font-semibold text-gray-700">Item Name</th>
                    <th className="text-center py-2 px-3 font-semibold text-gray-700">Qty</th>
                    <th className="text-right py-2 px-3 font-semibold text-gray-700">Daily Rate</th>
                    <th className="text-right py-2 px-3 font-semibold text-gray-700">Total Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {receipt.rentedItems.map((item, index) => (
                    <tr key={index} className="border-b border-gray-200">
                      <td className="py-3 px-3 text-gray-700">{item.name}</td>
                      <td className="py-3 px-3 text-center text-gray-700">{item.quantity}</td>
                      <td className="py-3 px-3 text-right text-gray-700">{formatCurrency(item.dailyRate)}</td>
                      <td className="py-3 px-3 text-right font-semibold text-gray-900">
                        {formatCurrency(item.totalItemCost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 pb-8 border-b border-gray-200">
            <div></div>
            <div className="space-y-3">
              <div className="flex justify-between text-gray-700">
                <span className="font-semibold">Subtotal:</span>
                <span>{formatCurrency(receipt.totalCost)}</span>
              </div>
              <div className="flex justify-between text-blue-600 font-semibold bg-blue-50 p-3 rounded">
                <span>Advance Payment:</span>
                <span>-{formatCurrency(receipt.advancePayment)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-gray-900 bg-yellow-50 p-3 rounded border-2 border-yellow-200">
                <span>Amount Due:</span>
                <span className={receipt.finalAmount > 0 ? 'text-red-600' : 'text-green-600'}>
                  {receipt.finalAmount > 0 ? formatCurrency(receipt.finalAmount) : 'Paid'}
                </span>
              </div>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="bg-gray-50 p-6 rounded border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 uppercase mb-3">Terms & Conditions</h3>
            <div className="text-xs text-gray-600 space-y-2">
              <p>
                • All equipment must be returned in the same condition as rented. Normal wear and tear is expected.
              </p>
              <p>
                • Rental charges are calculated on a per-day basis from the rent date to the expected return date.
              </p>
              <p>
                • If returned after the expected return date, daily charges will apply to the overdue days as well.
              </p>
              <p>
                • The advance payment has been applied to the total rental cost. Any remaining balance is due upon return.
              </p>
              <p>
                • Luckwin Stores is not responsible for any loss or damage to rented equipment during the rental period.
              </p>
              <p>
                • For any queries or concerns, please contact us immediately at the provided phone number.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8 pt-6 border-t border-gray-200 text-xs text-gray-600">
            <p className="font-semibold text-gray-700 mb-1">Thank you for choosing Luckwin Stores!</p>
            <p>Equipment Rental Professionals Since 2024</p>
            <p className="mt-2 text-gray-500">Digital Receipt - {formatDate(new Date())}</p>
          </div>
        </div>

        {/* Overdue Warning */}
        {receipt.status === 'Overdue' && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="text-red-700">
              <p className="font-semibold">Rental Overdue</p>
              <p className="text-sm">
                This rental is overdue for return. Please return the equipment as soon as possible to avoid additional charges.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            background: white;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ReceiptPage;
