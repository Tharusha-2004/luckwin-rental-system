/**
 * Customers Page Component
 * Register new customers and view their rental history
 */

import React, { useState, useEffect } from 'react';
import { customersAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import SuccessAlert from '../components/SuccessAlert';
import { Plus, Edit2, Trash2, Search, History } from 'lucide-react';

const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    nic: '',
    email: '',
    address: '',
    city: '',
    companyName: '',
    notes: '',
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await customersAPI.getAll();
      if (response.data.success) {
        setCustomers(response.data.data);
        setError('');
      }
    } catch (err) {
      setError('Failed to load customers');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.phone || !formData.nic) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      if (editingId) {
        await customersAPI.update(editingId, formData);
        setSuccess('Customer updated successfully');
      } else {
        await customersAPI.create(formData);
        setSuccess('Customer created successfully');
      }

      setFormData({
        name: '',
        phone: '',
        nic: '',
        email: '',
        address: '',
        city: '',
        companyName: '',
        notes: '',
      });
      setShowForm(false);
      setEditingId(null);
      fetchCustomers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save customer');
    }
  };

  const handleEdit = (customer) => {
    setFormData({
      name: customer.name,
      phone: customer.phone,
      nic: customer.nic,
      email: customer.email || '',
      address: customer.address || '',
      city: customer.city || '',
      companyName: customer.companyName || '',
      notes: customer.notes || '',
    });
    setEditingId(customer._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await customersAPI.delete(id);
        setSuccess('Customer deleted successfully');
        fetchCustomers();
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to delete customer');
      }
    }
  };

  const handleViewHistory = async (customer) => {
    try {
      const response = await customersAPI.getHistory(customer._id);
      if (response.data.success) {
        setSelectedCustomer(response.data);
        setShowHistory(true);
      }
    } catch (err) {
      setError('Failed to load customer history');
    }
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery)
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-6">
      {error && <ErrorAlert message={error} onClose={() => setError('')} />}
      {success && <SuccessAlert message={success} onClose={() => setSuccess('')} />}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Customer Management</h1>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setFormData({
              name: '',
              phone: '',
              nic: '',
              email: '',
              address: '',
              city: '',
              companyName: '',
              notes: '',
            });
          }}
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          <Plus size={20} />
          Add Customer
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? 'Edit Customer' : 'Register New Customer'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Full name"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Phone *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleFormChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="e.g., +1234567890"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">NIC *</label>
              <input
                type="text"
                name="nic"
                value={formData.nic}
                onChange={handleFormChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="National ID / NIC"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleFormChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="email@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Company Name</label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleFormChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Optional company"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleFormChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="City"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-2">Address</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleFormChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Full address"
                rows="2"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-2">Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleFormChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Any additional notes"
                rows="2"
              />
            </div>

            <div className="md:col-span-2 flex gap-2">
              <button
                type="submit"
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                {editingId ? 'Update' : 'Create'} Customer
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="mb-6 flex items-center gap-2">
        <Search size={20} className="text-gray-400" />
        <input
          type="text"
          placeholder="Search by name or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 border border-gray-300 rounded px-3 py-2"
        />
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        {filteredCustomers.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Name</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Phone</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">NIC</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Company</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredCustomers.map((customer) => (
                <tr key={customer._id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-semibold text-gray-900">{customer.name}</td>
                  <td className="px-6 py-3 text-gray-600">{customer.phone}</td>
                  <td className="px-6 py-3 text-gray-600">{customer.nic}</td>
                  <td className="px-6 py-3 text-gray-600">{customer.companyName || '-'}</td>
                  <td className="px-6 py-3 flex gap-2">
                    <button
                      onClick={() => handleViewHistory(customer)}
                      className="text-green-500 hover:text-green-700"
                      title="View History"
                    >
                      <History size={18} />
                    </button>
                    <button
                      onClick={() => handleEdit(customer)}
                      className="text-blue-500 hover:text-blue-700"
                      title="Edit"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(customer._id)}
                      className="text-red-500 hover:text-red-700"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-6 text-center text-gray-500">
            {customers.length === 0 ? 'No customers found. Add your first customer!' : 'No customers match your search.'}
          </div>
        )}
      </div>

      {/* History Modal */}
      {showHistory && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">
                {selectedCustomer.customer.name} - Rental History
              </h2>
            </div>
            <div className="p-6">
              {selectedCustomer.rentals.length > 0 ? (
                <div className="space-y-3">
                  {selectedCustomer.rentals.map((rental) => (
                    <div key={rental._id} className="border rounded p-3 hover:bg-gray-50">
                      <div className="flex justify-between">
                        <span className="font-semibold text-blue-600">
                          {rental.agreementToken.slice(0, 8)}...
                        </span>
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
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
                      <p className="text-xs text-gray-600 mt-1">Items: {rental.rentedItems.length}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center">No rental history</p>
              )}
            </div>
            <div className="p-6 border-t flex justify-end">
              <button
                onClick={() => setShowHistory(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersPage;
