/**
 * Shared Axios Instance — src/api/api.js
 *
 * All components should import this instead of raw `axios`.
 * It automatically attaches the JWT Bearer token to every request
 * and handles 401 responses globally (auto-logout on token expiry).
 */
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://luckwin-rental-system.onrender.com';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// ── Request interceptor: attach token to every outgoing request ──────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('luckwin_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: auto-logout on 401 (expired / invalid token) ───────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear stale credentials and send user back to login
      localStorage.removeItem('luckwin_token');
      localStorage.removeItem('luckwin_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
