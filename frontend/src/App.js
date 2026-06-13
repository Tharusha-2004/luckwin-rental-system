import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';

// Layout Component
import Layout from './components/Layout';

// Components
import Inventory from './components/Inventory';
import NewRental from './components/NewRental';
import Returns from './components/Returns';

// Pages
import Dashboard from './pages/Dashboard';
import CustomersPage from './pages/CustomersPage';
import RentalsPage from './pages/RentalsPage';
import ReceiptPage from './pages/ReceiptPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* Standalone full-screen pages (no Layout) */}
        <Route path="/login" element={<Login />} />

        {/* Protected routes — require a valid token */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout><Dash board /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory"
          element={
            <ProtectedRoute>
              <Layout><Inventory /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/customers"
          element={
            <ProtectedRoute>
              <Layout><CustomersPage /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/rentals"
          element={
            <ProtectedRoute>
              <Layout><RentalsPage /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/pos"
          element={
            <ProtectedRoute>
              <Layout><NewRental /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/returns"
          element={
            <ProtectedRoute>
              <Layout><Returns /></Layout>
            </ProtectedRoute>
          }
        />

        {/* Full-screen Receipt Page (NO Layout) - for printing */}
        <Route path="/receipt/:token" element={<ReceiptPage />} />
      </Routes>
    </Router>
  );
}

export default App;
