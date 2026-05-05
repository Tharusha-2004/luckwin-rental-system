/**
 * Inventory Page Component
 * Add/Edit/View items and their available quantities
 */

import React, { useState, useEffect } from 'react';
import { itemsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import SuccessAlert from '../components/SuccessAlert';
import { formatCurrency } from '../utils/helpers';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';

const InventoryPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    dailyRate: '',
    totalQuantity: '',
    category: 'Other',
    unit: 'unit',
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await itemsAPI.getAll();
      if (response.data.success) {
        setItems(response.data.data);
        setError('');
      }
    } catch (err) {
      setError('Failed to load items');
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

    if (!formData.name || !formData.dailyRate || !formData.totalQuantity) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      if (editingId) {
        await itemsAPI.update(editingId, formData);
        setSuccess('Item updated successfully');
      } else {
        await itemsAPI.create(formData);
        setSuccess('Item created successfully');
      }

      setFormData({
        name: '',
        description: '',
        dailyRate: '',
        totalQuantity: '',
        category: 'Other',
        unit: 'unit',
      });
      setShowForm(false);
      setEditingId(null);
      fetchItems();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save item');
    }
  };

  const handleEdit = (item) => {
    setFormData({
      name: item.name,
      description: item.description || '',
      dailyRate: item.dailyRate,
      totalQuantity: item.totalQuantity,
      category: item.category,
      unit: item.unit,
    });
    setEditingId(item._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await itemsAPI.delete(id);
        setSuccess('Item deleted successfully');
        fetchItems();
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to delete item');
      }
    }
  };

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-6">
      {error && <ErrorAlert message={error} onClose={() => setError('')} />}
      {success && <SuccessAlert message={success} onClose={() => setSuccess('')} />}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setFormData({
              name: '',
              description: '',
              dailyRate: '',
              totalQuantity: '',
              category: 'Other',
              unit: 'unit',
            });
          }}
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          <Plus size={20} />
          Add Item
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? 'Edit Item' : 'Add New Item'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Item Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="e.g., Scaffolding Boards"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleFormChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option>Scaffolding</option>
                <option>Tools</option>
                <option>Machinery</option>
                <option>Safety</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Daily Rate (USD) *</label>
              <input
                type="number"
                name="dailyRate"
                value={formData.dailyRate}
                onChange={handleFormChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="e.g., 50"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Total Quantity *</label>
              <input
                type="number"
                name="totalQuantity"
                value={formData.totalQuantity}
                onChange={handleFormChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="e.g., 100"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Unit</label>
              <input
                type="text"
                name="unit"
                value={formData.unit}
                onChange={handleFormChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="e.g., pieces"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Description</label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Optional description"
              />
            </div>

            <div className="md:col-span-2 flex gap-2">
              <button
                type="submit"
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                {editingId ? 'Update' : 'Create'} Item
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
          placeholder="Search items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 border border-gray-300 rounded px-3 py-2"
        />
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        {filteredItems.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Name</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Category</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Daily Rate</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Available</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Total</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredItems.map((item) => (
                <tr key={item._id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-semibold text-gray-900">{item.name}</td>
                  <td className="px-6 py-3 text-gray-600">{item.category}</td>
                  <td className="px-6 py-3 text-gray-600">{formatCurrency(item.dailyRate)}</td>
                  <td className="px-6 py-3">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        item.availableQuantity < item.totalQuantity * 0.1
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {item.availableQuantity}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-600">{item.totalQuantity}</td>
                  <td className="px-6 py-3 flex gap-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-blue-500 hover:text-blue-700"
                      title="Edit"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(item._id)}
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
            {items.length === 0 ? 'No items found. Add your first item!' : 'No items match your search.'}
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryPage;
