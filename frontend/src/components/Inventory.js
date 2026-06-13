/**
 * Inventory Management Component
 * Display and manage equipment inventory with add/edit/delete functionality
 * Integrated with backend API for real-time data
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  Loader,
  X,
  Package,
  Grid3x3,
} from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const CATEGORIES = ['Power Tools', 'Hand Tools', 'Heavy Machinery', 'Other'];

const Inventory = () => {
  // Items and Loading State
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal and Form State
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    category: 'Power Tools',
    dailyRate: '',
    totalQuantity: '',
    unit: 'unit',
  });

  // Fetch items on component mount
  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get(`${API_BASE_URL}/items`);

      if (response.data.success) {
        setItems(response.data.data);
      } else {
        setError(response.data.message || 'Failed to fetch items');
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || 'Failed to load inventory items';
      setError(errorMsg);
      console.error('Error fetching items:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      category: 'Power Tools',
      dailyRate: '',
      totalQuantity: '',
      unit: 'unit',
    });
    setEditingId(null);
  };

  // Handle modal open
  const openModal = () => {
    resetForm();
    setShowModal(true);
  };

  // Handle modal close
  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  // Handle form submission (Add/Update item)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.name.trim()) {
      setError('Item name is required');
      return;
    }
    if (!formData.dailyRate || parseFloat(formData.dailyRate) <= 0) {
      setError('Daily rate must be a positive number');
      return;
    }
    if (!formData.totalQuantity || parseInt(formData.totalQuantity) <= 0) {
      setError('Total quantity must be a positive number');
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        name: formData.name.trim(),
        category: formData.category,
        dailyRate: parseFloat(formData.dailyRate),
        totalQuantity: parseInt(formData.totalQuantity),
        unit: formData.unit,
      };

      let response;
      if (editingId) {
        // Update existing item
        response = await axios.put(`${API_BASE_URL}/items/${editingId}`, payload);
      } else {
        // Create new item
        response = await axios.post(`${API_BASE_URL}/items`, payload);
      }

      if (response.data.success) {
        setSuccess(
          editingId
            ? '✓ Item updated successfully!'
            : '✓ Item added successfully!'
        );
        closeModal();
        fetchItems(); // Refresh items list
      } else {
        setError(response.data.message || 'Failed to save item');
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || 'Error saving item. Please try again.';
      setError(errorMsg);
      console.error('Error saving item:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete item
  const handleDelete = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      setError('');
      const response = await axios.delete(`${API_BASE_URL}/items/${itemId}`);

      if (response.data.success) {
        setSuccess('✓ Item deleted successfully!');
        fetchItems();
      } else {
        setError(response.data.message || 'Failed to delete item');
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || 'Error deleting item. Please try again.';
      setError(errorMsg);
      console.error('Error deleting item:', err);
    }
  };

  // Handle edit item
  const handleEdit = (item) => {
    setFormData({
      name: item.name,
      category: item.category || 'Power Tools',
      dailyRate: item.dailyRate.toString(),
      totalQuantity: item.totalQuantity.toString(),
      unit: item.unit || 'unit',
    });
    setEditingId(item._id);
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600 rounded-lg">
            <Package className="text-white" size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Inventory Management</h1>
            <p className="text-slate-400 text-sm mt-1">
              Manage equipment, track quantities, and maintain rental rates
            </p>
          </div>
        </div>
        <button
          onClick={openModal}
          className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-lg font-semibold transition transform hover:scale-105"
        >
          <Plus size={20} />
          Add New Item
        </button>
      </div>

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

      {/* Inventory Table */}
      <div className="bg-slate-700 rounded-xl shadow-xl overflow-hidden">
        {/* Table Header */}
        <div className="px-6 py-4 border-b border-slate-600 bg-slate-800">
          <div className="flex items-center gap-3">
            <Grid3x3 className="text-blue-400" size={20} />
            <h2 className="text-lg font-bold text-white">
              Items ({items.length})
            </h2>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="animate-spin text-blue-400" size={32} />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Package className="text-slate-500 mb-4" size={48} />
              <p className="text-slate-400 text-lg font-medium">
                No items in inventory
              </p>
              <p className="text-slate-500 text-sm mt-1">
                Click "Add New Item" to get started
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-800 border-b border-slate-600">
                  <th className="px-6 py-4 text-left font-semibold text-slate-300">
                    Item Name
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-300">
                    Category
                  </th>
                  <th className="px-6 py-4 text-right font-semibold text-slate-300">
                    Daily Rate
                  </th>
                  <th className="px-6 py-4 text-center font-semibold text-slate-300">
                    Total Qty
                  </th>
                  <th className="px-6 py-4 text-center font-semibold text-slate-300">
                    Available
                  </th>
                  <th className="px-6 py-4 text-center font-semibold text-slate-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr
                    key={item._id}
                    className={`border-b border-slate-600 transition hover:bg-slate-600 ${
                      index % 2 === 0 ? 'bg-slate-700' : 'bg-slate-750'
                    }`}
                  >
                    <td className="px-6 py-4">
                      <p className="font-medium text-white">{item.name}</p>
                      <p className="text-slate-400 text-xs mt-1">
                        Unit: {item.unit}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-3 py-1 bg-blue-600/20 text-blue-300 rounded-full text-xs font-medium">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="font-semibold text-green-400">
                        Rs. {item.dailyRate}/day
                      </p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <p className="font-medium text-white">
                        {item.totalQuantity}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <p
                        className={`font-medium ${
                          item.availableQuantity > 0
                            ? 'text-emerald-400'
                            : 'text-red-400'
                        }`}
                      >
                        {item.availableQuantity}
                      </p>
                      {item.availableQuantity === 0 && (
                        <p className="text-red-400 text-xs font-semibold mt-1">
                          Out of Stock
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 hover:bg-blue-600 text-blue-400 hover:text-white rounded transition"
                          title="Edit item"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="p-2 hover:bg-red-600 text-red-400 hover:text-white rounded transition"
                          title="Delete item"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add/Edit Item Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-700 rounded-xl shadow-2xl max-w-md w-full border border-slate-600">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-600 bg-slate-800">
              <h2 className="text-xl font-bold text-white">
                {editingId ? 'Edit Item' : 'Add New Item'}
              </h2>
              <button
                onClick={closeModal}
                className="p-1 hover:bg-slate-600 text-slate-400 hover:text-white rounded transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Item Name */}
              <div>
                <label className="block text-slate-300 font-medium mb-2">
                  Item Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Excavator, Drill"
                  className="w-full px-4 py-2 rounded-lg bg-slate-600 text-white placeholder-slate-400 border border-slate-500 focus:border-blue-400 focus:outline-none transition"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-slate-300 font-medium mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg bg-slate-600 text-white border border-slate-500 focus:border-blue-400 focus:outline-none transition"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Daily Rate */}
              <div>
                <label className="block text-slate-300 font-medium mb-2">
                  Daily Rate (Rs.) *
                </label>
                <input
                  type="number"
                  name="dailyRate"
                  value={formData.dailyRate}
                  onChange={handleInputChange}
                  placeholder="e.g., 500"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 rounded-lg bg-slate-600 text-white placeholder-slate-400 border border-slate-500 focus:border-blue-400 focus:outline-none transition"
                />
              </div>

              {/* Total Quantity */}
              <div>
                <label className="block text-slate-300 font-medium mb-2">
                  Total Quantity *
                </label>
                <input
                  type="number"
                  name="totalQuantity"
                  value={formData.totalQuantity}
                  onChange={handleInputChange}
                  placeholder="e.g., 50"
                  min="0"
                  className="w-full px-4 py-2 rounded-lg bg-slate-600 text-white placeholder-slate-400 border border-slate-500 focus:border-blue-400 focus:outline-none transition"
                />
              </div>

              {/* Unit */}
              <div>
                <label className="block text-slate-300 font-medium mb-2">
                  Unit *
                </label>
                <input
                  type="text"
                  name="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
                  placeholder="e.g., unit, piece, set"
                  className="w-full px-4 py-2 rounded-lg bg-slate-600 text-white placeholder-slate-400 border border-slate-500 focus:border-blue-400 focus:outline-none transition"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 rounded-lg bg-slate-600 hover:bg-slate-500 disabled:opacity-50 text-white font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium transition flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader className="animate-spin" size={16} />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      {editingId ? 'Update Item' : 'Add Item'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
