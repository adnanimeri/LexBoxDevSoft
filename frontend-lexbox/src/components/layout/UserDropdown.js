import React, { useState, useRef, useEffect } from 'react';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

/**
 * User dropdown menu component in header
 * Provides quick access to user settings and logout
 */
const UserDropdown = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { logout } = useAuth();
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* User button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
      >
        <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
          <span className="text-sm font-medium text-white">
            {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
          </span>
        </div>
        <ChevronDown className="h-4 w-4 text-gray-600" />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
          <div className="px-4 py-2 border-b border-gray-200">
            <p className="text-sm font-medium text-gray-900">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
          
          <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
            <Settings className="mr-3 h-4 w-4" />
            Settings
          </button>
          
          <button 
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
          >
            <LogOut className="mr-3 h-4 w-4" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default UserDropdown;