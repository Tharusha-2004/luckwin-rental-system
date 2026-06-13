import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css';

// Components
import Navbar from './components/Navbar';
import NewRental from './components/NewRental';
import Returns from './components/Returns';

// Pages
import Dashboard from './pages/Dashboard';
import InventoryPage from './pages/InventoryPage';
import CustomersPage from './pages/CustomersPage';
import RentalsPage from './pages/RentalsPage';
import ReceiptPage from './pages/ReceiptPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Navigation Bar */}
        <Navbar />

        {/* Routes */}
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/rentals" element={<RentalsPage />} />
          <Route path="/new-rental" element={<NewRental />} />
          <Route path="/returns" element={<Returns />} />
          <Route path="/receipt/:token" element={<ReceiptPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
