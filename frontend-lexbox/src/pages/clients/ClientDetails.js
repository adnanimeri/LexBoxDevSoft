// ===================================================================
// CLIENT DETAILS PAGE
// ===================================================================
// src/pages/clients/ClientDetails.js
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
//import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
  Calendar
} from 'lucide-react';
import { clientService } from '../../services/clientService';
import { timelineService } from '../../services/timelineService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Timeline from '../../components/timeline/Timeline';
import DocumentsList from '../../components/documents/DocumentsList';
import AddTimelineNodeModal from '../../components/timeline/AddTimelineNodeModal';
import AssignDossierModal from '../../components/clients/AssignDossierModal';

/**
 * Client details page with timeline, documents, and billing information
 * Central hub for all client-related activities and case management
 */
const ClientDetails = () => {
  const { clientId } = useParams();
  const [activeTab, setActiveTab] = useState('timeline');
  const [showAddNodeModal, setShowAddNodeModal] = useState(false);
  const [showDossierModal, setShowDossierModal] = useState(false);
  
  const { hasPermission } = useAuth();
  const { showSuccess, showError } = useNotification();
  const queryClient = useQueryClient();

  // Fetch client details
  /*const { data: client, isLoading: clientLoading, error: clientError } = useQuery(
    ['client', clientId],
    () => clientService.getClient(clientId),
    {
      staleTime: 60000 // 1 minute
    }
  );*/

// Fetch client timeline
  const { data: client, isLoading: clientLoading, error: clientError } = useQuery({
  queryKey: ['client', clientId],
  queryFn: () => clientService.getClient(clientId),
  staleTime: 60000
});

 /* // Fetch client timeline
  const { data: timeline, isLoading: timelineLoading } = useQuery(
    ['timeline', client?.dossier?.id],
    () => client?.dossier?.id ? timelineService.getTimeline(client.dossier.id) : null,
    {
      enabled: !!client?.dossier?.id,
      staleTime: 30000 // 30 seconds
    }
  );*/
// Fetch client timeline
const { data: timeline, isLoading: timelineLoading } = useQuery({
  queryKey: ['timeline', client?.dossier?.id],
  queryFn: () => client?.dossier?.id ? timelineService.getTimeline(client.dossier.id) : null,
  enabled: !!client?.dossier?.id,
  staleTime: 30000
});


  // Assign dossier number mutation
const assignDossierMutation = useMutation({
  mutationFn: ({ clientId, dossierNumber }) => clientService.assignDossierNumber(clientId, dossierNumber),
  onSuccess: () => {
    queryClient.invalidateQueries(['client', clientId]);
    showSuccess('Dossier number assigned successfully');
    setShowDossierModal(false);
  },
  onError: (error) => {
    showError('Failed to assign dossier number');
  }
});

  //old 
  /*const assignDossierMutation = useMutation(
    ({ clientId, dossierNumber }) => clientService.assignDossierNumber(clientId, dossierNumber),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['client', clientId]);
        showSuccess('Dossier number assigned successfully');
        setShowDossierModal(false);
      },
      onError: (error) => {
        showError('Failed to assign dossier number');
      }
    }
  );*/

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

  const tabs = [
    { id: 'timeline', name: 'Timeline', icon: Clock, permission: 'timeline:read' },
    { id: 'documents', name: 'Documents', icon: FileText, permission: 'documents:read' },
    { id: 'billing', name: 'Billing', icon: DollarSign, permission: 'billing:read' },
  ];

  const allowedTabs = tabs.filter(tab => 
    !tab.permission || hasPermission(tab.permission)
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
              {client.dossier_number ? `Dossier: ${client.dossier_number}` : 'No dossier assigned'}
            </p>
          </div>
        </div>

        <div className="flex space-x-3">
          {!client.dossier_number && hasPermission('clients:update') && (
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
                  {new Date(client.created_at).toLocaleDateString()}
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
          {/* Timeline tab */}
          {activeTab === 'timeline' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">Case Timeline</h3>
                {client.dossier_number && hasPermission('timeline:create') && (
                  <button
                    onClick={() => setShowAddNodeModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Activity
                  </button>
                )}
              </div>
              
              {client.dossier_number ? (
                <Timeline 
                  timeline={timeline} 
                  loading={timelineLoading} 
                  dossierId={client.dossier?.id}
                />
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Timeline will be available after dossier number is assigned</p>
                </div>
              )}
            </div>
          )}

          {/* Documents tab */}
          {activeTab === 'documents' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">Documents</h3>
                {hasPermission('documents:create') && (
                  <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Upload Documents
                  </button>
                )}
              </div>
              
              <DocumentsList 
                dossierId={client.dossier?.id} 
                canUpload={hasPermission('documents:create')}
              />
            </div>
          )}

          {/* Billing tab */}
          {activeTab === 'billing' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">Billing & Invoices</h3>
                {hasPermission('billing:create') && (
                  <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Generate Invoice
                  </button>
                )}
              </div>
              
              {/* Billing content placeholder */}
              <div className="text-center py-12 text-gray-500">
                <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Billing information will be displayed here</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showAddNodeModal && (
        <AddTimelineNodeModal
          isOpen={showAddNodeModal}
          onClose={() => setShowAddNodeModal(false)}
          dossierId={client.dossier?.id}
        />
      )}

      {showDossierModal && (
        <AssignDossierModal
          isOpen={showDossierModal}
          onClose={() => setShowDossierModal(false)}
          clientId={clientId}
          onAssign={(dossierNumber) => 
            assignDossierMutation.mutate({ clientId, dossierNumber })
          }
          loading={assignDossierMutation.isLoading}
        />
      )}
    </div>
  );
};

export default ClientDetails;