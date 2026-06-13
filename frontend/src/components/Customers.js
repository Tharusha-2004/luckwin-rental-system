/**
 * Customers Component
 * Displays all registered customers in a searchable, dark-themed table.
 * Fetches data from GET /api/customers with JWT auth header.
 */

import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import {
  Users,
  Search,
  Loader,
  AlertCircle,
  UserCheck,
  Phone,
  CreditCard,
  Calendar,
  RefreshCw,
} from 'lucide-react';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [filtered, setFiltered]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [search, setSearch]       = useState('');

  // ── Fetch all customers on mount ────────────────────────────────────────────
  useEffect(() => {
    fetchCustomers();
  }, []);

  // ── Re-filter whenever search term or customer list changes ─────────────────
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
      // apiClient automatically attaches Authorization: Bearer <token>
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

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getInitials = (name = '') =>
    name
      .split(' ')
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Page Header ──────────────────────────────────────────────────────── */}
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

      {/* ── Error Banner ─────────────────────────────────────────────────────── */}
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

      {/* ── Search Bar ───────────────────────────────────────────────────────── */}
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

      {/* ── Table Card ───────────────────────────────────────────────────────── */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">

        {/* Table header bar */}
        <div className="px-6 py-4 border-b border-slate-700 bg-slate-800/80 flex items-center gap-3">
          <UserCheck className="text-indigo-400" size={20} />
          <h2 className="text-lg font-bold text-white">Customer Directory</h2>
        </div>

        {/* ── Loading State ─────────────────────────────────────────────────── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader className="animate-spin text-indigo-400" size={36} />
            <p className="text-slate-400 text-sm">Loading customers…</p>
          </div>

        /* ── Empty State ──────────────────────────────────────────────────── */
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

        /* ── Data Table ───────────────────────────────────────────────────── */
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-900/60 border-b border-slate-700">
                  <th className="px-6 py-4 text-left font-semibold text-slate-400 uppercase tracking-wider text-xs">
                    <div className="flex items-center gap-2">
                      <UserCheck size={14} /> Customer
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-400 uppercase tracking-wider text-xs">
                    <div className="flex items-center gap-2">
                      <Phone size={14} /> Phone
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-400 uppercase tracking-wider text-xs">
                    <div className="flex items-center gap-2">
                      <CreditCard size={14} /> NIC
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-400 uppercase tracking-wider text-xs">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} /> Joined Date
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {filtered.map((customer, index) => (
                  <tr
                    key={customer._id}
                    className={`group transition-colors duration-150 hover:bg-slate-700/40 ${
                      index % 2 === 0 ? 'bg-slate-800' : 'bg-slate-800/50'
                    }`}
                  >
                    {/* Name + avatar */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-md">
                          {getInitials(customer.name)}
                        </div>
                        <div>
                          <p className="font-semibold text-white group-hover:text-indigo-300 transition-colors">
                            {customer.name || '—'}
                          </p>
                          {customer.companyName && (
                            <p className="text-slate-500 text-xs mt-0.5">
                              {customer.companyName}
                            </p>
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
                      <span className="text-slate-400 text-sm">
                        {formatDate(customer.createdAt)}
                      </span>
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
    </div>
  );
};

export default Customers;
