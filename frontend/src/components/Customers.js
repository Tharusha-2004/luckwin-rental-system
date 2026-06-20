/**
 * Customers Component
 * Displays all registered customers in a searchable, dark-themed table.
 * Supports inline Edit (modal) and Delete with confirmation.
 * Fetches data from GET /api/customers via the shared apiClient (JWT auto-attached).
 */

import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import {
  Users,
  Search,
  Loader,
  AlertCircle,
  User,
  UserCheck,
  Phone,
  CreditCard,
  Calendar,
  RefreshCw,
  Pencil,
  Trash2,
  X,
  Save,
} from 'lucide-react';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // ── Edit modal state ──────────────────────────────────────────────────────────
  const [editingCustomer, setEditingCustomer] = useState(null); // null = closed
  const [editForm, setEditForm] = useState({ name: '', phone: '', nic: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  
  // ── Lightbox state ────────────────────────────────────────────────────────────
  const [fullImage, setFullImage] = useState(null);

  // ── Fetch all customers on mount ─────────────────────────────────────────────
  useEffect(() => {
    fetchCustomers();
  }, []);

  // ── Re-filter whenever search term or customer list changes ──────────────────
  useEffect(() => {
    const q = search.toLowerCase();
    if (!q) {
      setFiltered(customers);
    } else {
      setFiltered(
        customers.filter(
          (c) =>
            c.name?.toLowerCase().includes(q) ||
            c.phone?.toLowerCase().includes(q) ||
            c.nic?.toLowerCase().includes(q)
        )
      );
    }
  }, [search, customers]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiClient.get('/customers');
      if (response.data.success) {
        setCustomers(response.data.data);
      } else {
        setError(response.data.message || 'Failed to fetch customers.');
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Failed to load customers. Please try again.'
      );
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Delete handler ────────────────────────────────────────────────────────────
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }
    try {
      await apiClient.delete(`/customers/${id}`);
      // Refresh the list after successful delete
      fetchCustomers();
    } catch (err) {
      alert(
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Failed to delete customer. Please try again.'
      );
      console.error('Error deleting customer:', err);
    }
  };

  // ── Open edit modal ───────────────────────────────────────────────────────────
  const openEditModal = (customer) => {
    setEditingCustomer(customer);
    setEditForm({                   // <--- setEditForm kiyala wenas kala!
      name: customer.name || '',
      phone: customer.phone || '',
      nic: customer.nic || '',
      photo: customer.photo || null,
    });
    setEditError('');
    setEditSuccess('');
  };

  const closeEditModal = () => {
    setEditingCustomer(null);
    setEditError('');
    setEditSuccess('');
  };

  // ── Edit submit handler ───────────────────────────────────────────────────────
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim() || !editForm.phone.trim() || !editForm.nic.trim()) {
      setEditError('Name, phone, and NIC are required.');
      return;
    }
    try {
      setEditLoading(true);
      setEditError('');
      const response = await apiClient.put(`/customers/${editingCustomer._id}`, {
        name: editForm.name.trim(),
        phone: editForm.phone.trim(),
        nic: editForm.nic.trim(),
        photo: editForm.photo,
      });
      if (response.data.success) {
        setEditSuccess('Customer updated successfully!');
        setTimeout(() => {
          closeEditModal();
          fetchCustomers();
        }, 800);
      } else {
        setEditError(response.data.message || 'Update failed.');
      }
    } catch (err) {
      setEditError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Failed to update customer. Please try again.'
      );
      console.error('Error updating customer:', err);
    } finally {
      setEditLoading(false);
    }
  };

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  };

  const getInitials = (name = '') =>
    name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Page Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-600 rounded-xl shadow-lg">
            <Users className="text-white" size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Customers</h1>
            <p className="text-slate-400 text-sm mt-0.5">
              All registered customers &amp; their details
            </p>
          </div>
        </div>

        {/* Refresh + count badge */}
        <div className="flex items-center gap-3">
          {!loading && (
            <span className="bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full text-sm font-medium">
              {filtered.length} customer{filtered.length !== 1 ? 's' : ''}
            </span>
          )}
          <button
            onClick={fetchCustomers}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-all duration-200 disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span className="text-sm font-medium">Refresh</span>
          </button>
        </div>
      </div>

      {/* ── Error Banner ───────────────────────────────────────────────────────── */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="text-red-300 font-medium">Error loading customers</p>
            <p className="text-red-400 text-sm mt-1">{error}</p>
          </div>
          <button
            onClick={fetchCustomers}
            className="ml-auto text-red-400 hover:text-red-300 text-sm underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Search Bar ─────────────────────────────────────────────────────────── */}
      <div className="relative">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
          size={18}
        />
        <input
          type="text"
          placeholder="Search by name, phone or NIC…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
          >
            ✕
          </button>
        )}
      </div>

      {/* ── Table Card ─────────────────────────────────────────────────────────── */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">

        {/* Table header bar */}
        <div className="px-6 py-4 border-b border-slate-700 bg-slate-800/80 flex items-center gap-3">
          <UserCheck className="text-indigo-400" size={20} />
          <h2 className="text-lg font-bold text-white">Customer Directory</h2>
        </div>

        {/* ── Loading State ───────────────────────────────────────────────────── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader className="animate-spin text-indigo-400" size={36} />
            <p className="text-slate-400 text-sm">Loading customers…</p>
          </div>

          /* ── Empty State ────────────────────────────────────────────────────── */
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Users className="text-slate-600" size={48} />
            <p className="text-slate-400 font-medium text-lg">
              {search ? 'No customers match your search' : 'No customers yet'}
            </p>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="text-indigo-400 hover:text-indigo-300 text-sm underline"
              >
                Clear search
              </button>
            )}
          </div>

          /* ── Data Table ─────────────────────────────────────────────────────── */
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-900/60 border-b border-slate-700">
                  <th className="px-6 py-4 text-left font-semibold text-slate-400 uppercase tracking-wider text-xs">
                    <div className="flex items-center gap-2"><UserCheck size={14} /> Customer</div>
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-400 uppercase tracking-wider text-xs">
                    <div className="flex items-center gap-2"><Phone size={14} /> Phone</div>
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-400 uppercase tracking-wider text-xs">
                    <div className="flex items-center gap-2"><CreditCard size={14} /> NIC</div>
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-400 uppercase tracking-wider text-xs">
                    <div className="flex items-center gap-2"><Calendar size={14} /> Joined Date</div>
                  </th>
                  <th className="px-6 py-4 text-center font-semibold text-slate-400 uppercase tracking-wider text-xs">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {filtered.map((customer, index) => (
                  <tr
                    key={customer._id}
                    className={`group transition-colors duration-150 hover:bg-slate-700/40 ${index % 2 === 0 ? 'bg-slate-800' : 'bg-slate-800/50'
                      }`}
                  >
                    {/* Name + avatar */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {customer.photo ? (
                          <img 
                            src={customer.photo} 
                            alt={customer.name} 
                            onClick={() => setFullImage(customer.photo)}
                            className="w-9 h-9 rounded-full object-cover flex-shrink-0 shadow-md cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all" 
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-md">
                            {getInitials(customer.name)}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-white group-hover:text-indigo-300 transition-colors">
                            {customer.name || '—'}
                          </p>
                          {customer.companyName && (
                            <p className="text-slate-500 text-xs mt-0.5">{customer.companyName}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="px-6 py-4">
                      <span className="text-slate-300 font-mono tracking-wide">
                        {customer.phone || '—'}
                      </span>
                    </td>

                    {/* NIC */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-700 text-slate-300 font-mono text-xs border border-slate-600">
                        {customer.nic || '—'}
                      </span>
                    </td>

                    {/* Joined date */}
                    <td className="px-6 py-4">
                      <span className="text-slate-400 text-sm">{formatDate(customer.createdAt)}</span>
                    </td>

                    {/* ── Actions ──────────────────────────────────────────── */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {/* Edit button */}
                        <button
                          onClick={() => openEditModal(customer)}
                          title="Edit customer"
                          className="p-2 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 border border-transparent hover:border-indigo-500/30 transition-all duration-200"
                        >
                          <Pencil size={15} />
                        </button>
                        {/* Delete button */}
                        <button
                          onClick={() => handleDelete(customer._id, customer.name)}
                          title="Delete customer"
                          className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 transition-all duration-200"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Footer row */}
            <div className="px-6 py-3 border-t border-slate-700 bg-slate-900/40 flex items-center justify-between">
              <p className="text-slate-500 text-xs">
                Showing <span className="text-slate-300 font-medium">{filtered.length}</span> of{' '}
                <span className="text-slate-300 font-medium">{customers.length}</span> customers
              </p>
              <p className="text-slate-600 text-xs">
                Last updated: {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          Edit Customer Modal
      ════════════════════════════════════════════════════════════════════════ */}
      {editingCustomer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) closeEditModal(); }}
        >
          <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600/20 rounded-lg border border-indigo-500/30">
                  <Pencil className="text-indigo-400" size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Edit Customer</h3>
                  <p className="text-slate-400 text-xs mt-0.5">Update name, phone or NIC</p>
                </div>
              </div>
              <button
                onClick={closeEditModal}
                className="p-2 text-slate-500 hover:text-white hover:bg-slate-700 rounded-lg transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal body */}
            <form onSubmit={handleEditSubmit} className="px-6 py-5 space-y-5">

              {/* Avatar preview */}
              <div className="flex items-center gap-3 pb-1">
                {editForm.photo || editingCustomer.photo ? (
                  <img src={editForm.photo || editingCustomer.photo} alt="Avatar" className="w-12 h-12 rounded-full object-cover border border-slate-600 shadow-lg" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-lg">
                    {getInitials(editForm.name || editingCustomer.name)}
                  </div>
                )}
                <div>
                  <p className="text-white font-semibold">{editForm.name || editingCustomer.name}</p>
                  <p className="text-slate-500 text-xs">Customer ID: {editingCustomer._id?.slice(-8)}</p>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="e.g. John Perera"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Phone <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="e.g. 077 123 4567"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-mono"
                  required
                />
              </div>

              {/* NIC */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  NIC <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.nic}
                  onChange={(e) => setEditForm({ ...editForm, nic: e.target.value })}
                  placeholder="e.g. 200012345678"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-mono"
                  required
                />
              </div>

              {/* Photo */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Customer Photo (Optional)
                </label>
                <div className="flex items-center gap-4">
                  {editForm.photo ? (
                    <div className="relative">
                      <img src={editForm.photo} alt="Preview" className="w-16 h-16 rounded-full object-cover border-2 border-slate-600" />
                      <button
                        type="button"
                        onClick={() => setEditForm({ ...editForm, photo: null })}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 shadow-md"
                        title="Remove photo"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-dashed border-slate-600 flex items-center justify-center">
                      <User size={24} className="text-slate-500" />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setEditForm({ ...editForm, photo: reader.result });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-600/20 file:text-indigo-400 hover:file:bg-indigo-600/30 transition-all cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Inline feedback */}
              {editError && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  <AlertCircle size={15} />
                  {editError}
                </div>
              )}
              {editSuccess && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">
                  ✓ {editSuccess}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white transition-all font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-500/20"
                >
                  {editLoading ? (
                    <Loader size={15} className="animate-spin" />
                  ) : (
                    <Save size={15} />
                  )}
                  {editLoading ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Lightbox Modal for Full Image View ── */}
      {fullImage && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setFullImage(null)}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]">
            <button 
              onClick={() => setFullImage(null)}
              className="absolute -top-12 right-0 text-white hover:text-red-400 bg-slate-800/50 hover:bg-slate-800 p-2 rounded-full transition-all"
              title="Close"
            >
              <X size={24} />
            </button>
            <img 
              src={fullImage} 
              alt="Full Size View" 
              onClick={(e) => e.stopPropagation()}
              className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl" 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
