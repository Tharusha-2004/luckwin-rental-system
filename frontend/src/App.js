import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css';
import Login from './components/Login';

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

        {/* Routes with Layout Wrapper */}
        <Route
          path="/"
          element={
            <Layout>
              <Dashboard />
            </Layout>
          }
        />
        <Route
          path="/inventory"
          element={
            <Layout>
              <Inventory />
            </Layout>
          }
        />
        <Route
          path="/customers"
          element={
            <Layout>
              <CustomersPage />
            </Layout>
          }
        />
        <Route
          path="/rentals"
          element={
            <Layout>
              <RentalsPage />
            </Layout>
          }
        />
        <Route
          path="/pos"
          element={
            <Layout>
              <NewRental />
            </Layout>
          }
        />
        <Route
          path="/returns"
          element={
            <Layout>
              <Returns />
            </Layout>
          }
        />

        {/* Full-screen Receipt Page (NO Layout) - for printing */}
        <Route path="/receipt/:token" element={<ReceiptPage />} />
      </Routes>
    </Router>
  );
}

export default App;
