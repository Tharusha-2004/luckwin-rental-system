import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Attach JWT token to every outgoing request ────────────────────────────────
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('luckwin_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Global 401 handler: clear stale credentials and redirect to login ─────────
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('luckwin_token');
      localStorage.removeItem('luckwin_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Items API
export const itemsAPI = {
  getAll: () => apiClient.get('/items'),
  getById: (id) => apiClient.get(`/items/${id}`),
  create: (data) => apiClient.post('/items', data),
  update: (id, data) => apiClient.put(`/items/${id}`, data),
  delete: (id) => apiClient.delete(`/items/${id}`),
  getLowStock: () => apiClient.get('/items/low-stock'),
};

// Customers API
export const customersAPI = {
  getAll: () => apiClient.get('/customers'),
  getById: (id) => apiClient.get(`/customers/${id}`),
  getHistory: (id) => apiClient.get(`/customers/${id}/history`),
  create: (data) => apiClient.post('/customers', data),
  update: (id, data) => apiClient.put(`/customers/${id}`, data),
  delete: (id) => apiClient.delete(`/customers/${id}`),
  search: (query) => apiClient.get('/customers/search', { params: { query } }),
};

// Rentals API
export const rentalsAPI = {
  getAll: (params) => apiClient.get('/rentals', { params }),
  getById: (id) => apiClient.get(`/rentals/${id}`),
  getActive: () => apiClient.get('/rentals/active'),
  getOverdue: () => apiClient.get('/rentals/overdue'),
  create: (data) => apiClient.post('/rentals', data),
  processReturn: (id) => apiClient.post(`/rentals/${id}/return`),
};

// Receipt API
export const receiptAPI = {
  getByToken: (token) => apiClient.get(`/receipt/${token}`),
};

export default apiClient;
