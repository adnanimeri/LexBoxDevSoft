// ===================================================================
// MAIN LAYOUT COMPONENT
// ===================================================================
// src/components/layout/Layout.js
import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

/**
 * Main layout component that provides the application structure
 * Includes responsive sidebar, header, and main content area
 */
const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header onMenuClick={() => setSidebarOpen(true)} />
        
        {/* Main content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
