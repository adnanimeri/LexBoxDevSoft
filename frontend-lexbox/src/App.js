// src/App.js
//This is part!

// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';

// Pages
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import ClientList from './pages/clients/ClientList';
import ClientDetails from './pages/clients/ClientDetails';
import CreateClient from './pages/clients/CreateClient';
import EditClient from './pages/clients/EditClient';
import AdminPanel from './pages/admin/AdminPanel';

// Styles
import './styles/globals.css';

function App() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
        staleTime: 5 * 60 * 1000,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationProvider>
          <Router>
            <div className="App">
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                
                {/* Protected routes with layout */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                <Route path="/clients" element={
                  <ProtectedRoute>
                    <Layout>
                      <ClientList />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                <Route path="/clients/new" element={
                  <ProtectedRoute>
                    <Layout>
                      <CreateClient />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                <Route path="/clients/:clientId" element={
                  <ProtectedRoute>
                    <Layout>
                      <ClientDetails />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                <Route path="/clients/:clientId/edit" element={
                  <ProtectedRoute>
                    <Layout>
                      <EditClient />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                <Route path="/admin" element={
                  <ProtectedRoute requiredRole="admin">
                    <Layout>
                      <AdminPanel />
                    </Layout>
                  </ProtectedRoute>
                } />
              </Routes>
            </div>
          </Router>
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;


