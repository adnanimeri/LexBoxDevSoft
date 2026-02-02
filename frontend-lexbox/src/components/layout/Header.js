// ===================================================================
// HEADER COMPONENT
// ===================================================================
// src/components/layout/Header.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Search, Bell, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { clientService } from '../../services/clientService';
import UserDropdown from './UserDropdown';

/**
 * Application header with navigation, search, and user menu
 * Responsive design with mobile menu toggle
 */
const Header = ({ onMenuClick }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const searchRef = useRef(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Debounced search
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.length >= 2) {
        setIsSearching(true);
        try {
          const response = await clientService.searchClients(searchTerm, 5);
          setSearchResults(response.data || []);
          setShowResults(true);
        } catch (error) {
          console.error('Search error:', error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClientClick = (clientId) => {
    setSearchTerm('');
    setShowResults(false);
    navigate(`/clients/${clientId}`);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setShowResults(false);
  };

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
        <div className="flex-1 max-w-md mx-4 relative" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowResults(true)}
              placeholder="Search clients, dossiers..."
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Search Results Dropdown */}
          {showResults && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
              {isSearching ? (
                <div className="px-4 py-3 text-sm text-gray-500">Searching...</div>
              ) : searchResults.length > 0 ? (
                <>
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50">
                    Clients ({searchResults.length})
                  </div>
                  {searchResults.map((client) => (
                    <button
                      key={client.id}
                      onClick={() => handleClientClick(client.id)}
                      className="w-full px-4 py-3 flex items-center hover:bg-gray-50 text-left border-b border-gray-100 last:border-0"
                    >
                      <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center mr-3">
                        <span className="text-xs font-medium text-white">
                          {client.first_name?.charAt(0)}{client.last_name?.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {client.first_name} {client.last_name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {client.email || client.phone || client.personal_number || 'No contact info'}
                        </p>
                      </div>
                      {client.dossiers?.length > 0 && (
                        <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                          {client.dossiers[0].dossier_number}
                        </span>
                      )}
                    </button>
                  ))}
                </>
              ) : (
                <div className="px-4 py-3 text-sm text-gray-500">
                  No clients found for "{searchTerm}"
                </div>
              )}
            </div>
          )}
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