/**
 * Dashboard Page Component
 * Overview of active rentals, overdue items, and low-stock alerts
 */

import React, { useState, useEffect } from 'react';
import { rentalsAPI, itemsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import SuccessAlert from '../components/SuccessAlert';
import { formatDate, formatCurrency } from '../utils/helpers';
import { AlertCircle, TrendingUp, AlertTriangle, Package } from 'lucide-react';

const Dashboard = () => {
  const [activeRentals, setActiveRentals] = useState([]);
  const [overdueRentals, setOverdueRentals] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchDashboardData();
    // Refresh data every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

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

  if (loading) {
    return <LoadingSpinner />;
  }

  const statsCards = [
    {
      title: 'Active Rentals',
      value: activeRentals.length,
      icon: TrendingUp,
      color: 'blue',
    },
    {
      title: 'Overdue Items',
      value: overdueRentals.length,
      icon: AlertTriangle,
      color: 'red',
    },
    {
      title: 'Low Stock Items',
      value: lowStockItems.length,
      icon: Package,
      color: 'yellow',
    },
  ];

  return (
    <div className="p-6">
      {error && <ErrorAlert message={error} onClose={() => setError('')} />}
      {success && <SuccessAlert message={success} onClose={() => setSuccess('')} />}

      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      {/* Stats Cards */}
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

      {/* Active Rentals */}
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
                </tr>
              </thead>
              <tbody className="divide-y">
                {activeRentals.slice(0, 5).map((rental) => (
                  <tr key={rental._id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-mono text-xs text-blue-600">
                      {rental.agreementToken.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-3">
                      {rental.customerId?.name || (
                        <span className="italic text-gray-400">Deleted Customer</span>
                      )}
                    </td>
                    <td className="px-6 py-3">{formatDate(rental.rentDate)}</td>
                    <td className="px-6 py-3">{formatDate(rental.expectedReturnDate)}</td>
                    <td className="px-6 py-3 font-semibold">{formatCurrency(rental.totalCost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-6 text-center text-gray-500">No active rentals</div>
          )}
        </div>
      </div>

      {/* Overdue Rentals Alert */}
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
                    <p className="text-sm text-gray-600">
                      Due: {formatDate(rental.expectedReturnDate)}
                    </p>
                    <p className="text-sm text-red-600 font-semibold">
                      {rental.customerId?.phone || '—'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Low Stock Items */}
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
                        style={{
                          width: `${(item.availableQuantity / item.totalQuantity) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
