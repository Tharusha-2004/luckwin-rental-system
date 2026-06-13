/**
 * Main Layout Component
 * Provides fixed sidebar navigation and main content area
 * Dark theme with modern styling using Tailwind CSS
 */

import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, Home, ShoppingCart, RotateCcw, Settings, Package, LogOut, Users } from 'lucide-react';

const Layout = ({ children }) => {
  const [sidebarOpen, setShowSidebar] = useState(true);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('luckwin_token');
    localStorage.removeItem('luckwin_user');
    navigate('/login');
  };

  const toggleSidebar = () => {
    setShowSidebar(!sidebarOpen);
  };

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard', exact: true },
    { path: '/customers', icon: Users, label: 'Customers' },
    { path: '/inventory', icon: Package, label: 'Inventory' },
    { path: '/pos', icon: ShoppingCart, label: 'New Rental / POS' },
    { path: '/returns', icon: RotateCcw, label: 'Returns' },
  ];

  return (
    <div className="flex h-screen bg-slate-900">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-gradient-to-b from-slate-800 to-slate-900 border-r border-slate-700 transition-all duration-300 flex flex-col fixed left-0 h-screen shadow-xl`}
      >
        {/* Logo/Header */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
              <ShoppingCart className="text-white" size={24} />
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="text-lg font-bold text-white">LUCKWIN</h1>
                <p className="text-xs text-slate-400">STORES</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 group ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                  }`
                }
              >
                <Icon size={24} className="flex-shrink-0" />
                {sidebarOpen && (
                  <span className="font-medium text-sm">{item.label}</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Toggle & Settings */}
        <div className="border-t border-slate-700 p-4 space-y-2">
          <button
            onClick={toggleSidebar}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-all duration-200"
            title={sidebarOpen ? 'Collapse' : 'Expand'}
          >
            {sidebarOpen ? (
              <>
                <X size={20} />
                <span className="text-sm font-medium">Collapse</span>
              </>
            ) : (
              <Menu size={20} />
            )}
          </button>

          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center justify-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'
              }`
            }
          >
            <Settings size={20} />
            {sidebarOpen && <span className="text-sm font-medium">Settings</span>}
          </NavLink>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200"
            title="Logout"
          >
            <LogOut size={20} />
            {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div
        className={`${
          sidebarOpen ? 'ml-64' : 'ml-20'
        } flex-1 overflow-auto transition-all duration-300`}
      >
        {/* Top Bar */}
        <div className="bg-slate-800 border-b border-slate-700 px-8 py-4 shadow-sm sticky top-0 z-10">
          <h2 className="text-xl font-semibold text-white">Equipment Rental Management System</h2>
          <p className="text-slate-400 text-sm mt-1">LUCKWIN STORES - Rental & Inventory Management</p>
        </div>

        {/* Page Content */}
        <div className="p-8">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;
