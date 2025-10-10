// ===================================================================
// HEADER COMPONENT
// ===================================================================
// src/components/layout/Header.js
import React from 'react';
import { Menu, Search, Bell, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import UserDropdown from './UserDropdown';

/**
 * Application header with navigation, search, and user menu
 * Responsive design with mobile menu toggle
 */
const Header = ({ onMenuClick }) => {
  const { user } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left section - Menu toggle and logo */}
        <div className="flex items-center">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="ml-4 text-2xl font-bold text-blue-600">LexBox</h1>
        </div>

        {/* Center section - Search */}
        <div className="flex-1 max-w-md mx-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search clients, dossiers..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Right section - Notifications and user menu */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg relative">
            <Bell className="h-6 w-6" />
            <span className="absolute top-1 right-1 h-3 w-3 bg-red-500 rounded-full"></span>
          </button>

          {/* User menu */}
          <UserDropdown user={user} />
        </div>
      </div>
    </header>
  );
};

export default Header;