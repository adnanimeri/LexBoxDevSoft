// ===================================================================
// CLIENT DETAILS PAGE
// ===================================================================
// src/pages/clients/ClientDetails.js
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Edit, 
  FileText, 
  Clock, 
  DollarSign, 
  Phone, 
  Mail, 
  MapPin,
  Plus,
  Calendar,
  User
} from 'lucide-react';
import { clientService } from '../../services/clientService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Timeline from '../../components/timeline/Timeline';

/**
 * Client details page with timeline, documents, and billing information
 */
const ClientDetails = () => {
  const { clientId } = useParams();
  const [activeTab, setActiveTab] = useState('overview');
  const [showDossierModal, setShowDossierModal] = useState(false);
  const [dossierNumber, setDossierNumber] = useState('');
  const [dossierTitle, setDossierTitle] = useState('');
  const [legalIssueType, setLegalIssueType] = useState('other');
  
  const { hasPermission } = useAuth();
  const { showSuccess, showError } = useNotification();
  const queryClient = useQueryClient();

  // Fetch client details
  const { data: clientData, isLoading: clientLoading, error: clientError } = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => clientService.getClient(clientId),
    staleTime: 60000
  });

  // Assign dossier mutation
  const assignDossierMutation = useMutation({
    mutationFn: (dossierData) => clientService.assignDossierNumber(clientId, dossierData),
    onSuccess: () => {
      queryClient.invalidateQueries(['client', clientId]);
      showSuccess('Dossier assigned successfully');
      setShowDossierModal(false);
      setDossierNumber('');
      setDossierTitle('');
    },
    onError: (error) => {
      showError(error.response?.data?.message || 'Failed to assign dossier');
    }
  });

  const handleAssignDossier = (e) => {
    e.preventDefault();
    if (!dossierNumber.trim()) {
      showError('Dossier number is required');
      return;
    }
    assignDossierMutation.mutate({
      dossier_number: dossierNumber,
      title: dossierTitle || `Case for ${client.first_name} ${client.last_name}`,
      legal_issue_type: legalIssueType
    });
  };

  if (clientLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (clientError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error loading client details.</p>
        <Link
          to="/clients"
          className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Clients
        </Link>
      </div>
    );
  }

  const client = clientData?.data || clientData;
  const dossiers = client?.dossiers || [];
  const primaryDossier = dossiers[0];

  const tabs = [
    { id: 'overview', name: 'Overview', icon: User },
    { id: 'timeline', name: 'Timeline', icon: Clock, permission: 'timeline:read', requiresDossier: true },
    { id: 'documents', name: 'Documents', icon: FileText, permission: 'documents:read', requiresDossier: true },
    { id: 'billing', name: 'Billing', icon: DollarSign, permission: 'billing:read', requiresDossier: true },
  ];

  const allowedTabs = tabs.filter(tab => 
    (!tab.permission || hasPermission(tab.permission)) &&
    (!tab.requiresDossier || primaryDossier)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/clients"
            className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {client.first_name} {client.last_name}
            </h1>
            <p className="text-gray-600">
              {primaryDossier 
                ? `Dossier: ${primaryDossier.dossier_number}` 
                : 'No dossier assigned'}
            </p>
          </div>
        </div>

        <div className="flex space-x-3">
          {!primaryDossier && hasPermission('clients:update') && (
            <button
              onClick={() => setShowDossierModal(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Plus className="h-4 w-4 mr-2" />
              Assign Dossier
            </button>
          )}
          
          {hasPermission('clients:update') && (
            <Link
              to={`/clients/${clientId}/edit`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Client
            </Link>
          )}
        </div>
      </div>

      {/* Client info card */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center">
              <Mail className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">Email</p>
                <p className="text-sm text-gray-500">{client.email || 'Not provided'}</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <Phone className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">Phone</p>
                <p className="text-sm text-gray-500">{client.phone || 'Not provided'}</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">Registered</p>
                <p className="text-sm text-gray-500">
                  {new Date(client.createdAt || client.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
          
          {client.address && (
            <div className="mt-4 flex items-start">
              <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">Address</p>
                <p className="text-sm text-gray-500">{client.address}</p>
              </div>
            </div>
          )}

          {/* Dossier info */}
          {primaryDossier && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900">Active Dossier</h4>
              <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-blue-600">Number:</span>
                  <span className="ml-1 font-medium">{primaryDossier.dossier_number}</span>
                </div>
                <div>
                  <span className="text-blue-600">Type:</span>
                  <span className="ml-1 font-medium">{primaryDossier.legal_issue_type?.replace('_', ' ') || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-blue-600">Status:</span>
                  <span className="ml-1 font-medium">{primaryDossier.status}</span>
                </div>
                <div>
                  <span className="text-blue-600">Priority:</span>
                  <span className="ml-1 font-medium">{primaryDossier.priority}</span>
                </div>
              </div>
            </div>
          )}
          
          {client.notes && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-900">Notes</p>
              <p className="text-sm text-gray-500 mt-1">{client.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {allowedTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview tab */}
          {activeTab === 'overview' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Client Overview</h3>
              
              {!primaryDossier ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 mb-4">No dossier has been assigned yet</p>
                  {hasPermission('clients:update') && (
                    <button
                      onClick={() => setShowDossierModal(true)}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Assign Dossier Number
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-600">Total Billed</p>
                    <p className="text-2xl font-bold text-blue-900">
                      €{parseFloat(primaryDossier.total_billed || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-green-600">Total Paid</p>
                    <p className="text-2xl font-bold text-green-900">
                      €{parseFloat(primaryDossier.total_paid || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <p className="text-sm text-orange-600">Outstanding</p>
                    <p className="text-2xl font-bold text-orange-900">
                      €{(parseFloat(primaryDossier.total_billed || 0) - parseFloat(primaryDossier.total_paid || 0)).toFixed(2)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Timeline tab */}
          {activeTab === 'timeline' && primaryDossier && (
            <Timeline dossierId={primaryDossier.id} />
          )}

          {/* Documents tab */}
          {activeTab === 'documents' && (
            <div className="text-center py-12 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Document management coming in Phase 4</p>
            </div>
          )}

          {/* Billing tab */}
          {activeTab === 'billing' && (
            <div className="text-center py-12 text-gray-500">
              <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Billing & Invoices coming in Phase 5</p>
            </div>
          )}
        </div>
      </div>

      {/* Assign Dossier Modal */}
      {showDossierModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div 
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={() => setShowDossierModal(false)}
            />
            
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Assign Dossier Number
              </h3>
              
              <form onSubmit={handleAssignDossier} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dossier Number *
                  </label>
                  <input
                    type="text"
                    value={dossierNumber}
                    onChange={(e) => setDossierNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., DOS-2025-001"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Case Title
                  </label>
                  <input
                    type="text"
                    value={dossierTitle}
                    onChange={(e) => setDossierTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Property Dispute Case"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Legal Issue Type
                  </label>
                  <select
                    value={legalIssueType}
                    onChange={(e) => setLegalIssueType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="family_law">Family Law</option>
                    <option value="criminal_law">Criminal Law</option>
                    <option value="civil_law">Civil Law</option>
                    <option value="immigration">Immigration</option>
                    <option value="property_law">Property Law</option>
                    <option value="business_law">Business Law</option>
                    <option value="labor_law">Labor Law</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowDossierModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={assignDossierMutation.isPending}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {assignDossierMutation.isPending ? 'Assigning...' : 'Assign Dossier'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDetails;