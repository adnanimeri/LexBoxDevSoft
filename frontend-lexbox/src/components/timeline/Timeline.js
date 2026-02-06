// src/components/timeline/Timeline.js
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow, format } from 'date-fns';
import { 
  Plus, 
  Clock, 
  FileText, 
  DollarSign, 
  Flag, 
  CheckCircle,
  AlertCircle,
  Edit,
  Trash2,
  Filter
} from 'lucide-react';
import { timelineService } from '../../services/timelineService';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import TimelineNodeModal from './TimelineNodeModal';

/**
 * Timeline component for displaying and managing dossier activities
 */
const Timeline = ({ dossierId }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingNode, setEditingNode] = useState(null);
  const [filters, setFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);

  const { hasPermission } = useAuth();
  const { showSuccess, showError } = useNotification();
  const queryClient = useQueryClient();

  // Fetch timeline
  const { data: timelineData, isLoading, error } = useQuery({
    queryKey: ['timeline', dossierId, filters],
    queryFn: () => timelineService.getTimeline(dossierId, filters),
    enabled: !!dossierId
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (nodeId) => timelineService.deleteTimelineNode(nodeId),
    onSuccess: () => {
      showSuccess('Activity deleted successfully');
      queryClient.invalidateQueries(['timeline', dossierId]);
    },
    onError: () => {
      showError('Failed to delete activity');
    }
  });

  const handleAddNode = () => {
    setEditingNode(null);
    setShowModal(true);
  };

  const handleEditNode = (node) => {
    setEditingNode(node);
    setShowModal(true);
  };

  const handleDeleteNode = (nodeId) => {
    if (window.confirm('Are you sure you want to delete this activity?')) {
      deleteMutation.mutate(nodeId);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingNode(null);
  };

  const handleModalSuccess = () => {
    queryClient.invalidateQueries(['timeline', dossierId]);
    handleModalClose();
  };

  // Get node type styling
  const getNodeStyle = (nodeType) => {
    const styles = {
      registration: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-500', icon: CheckCircle },
      legal_classification: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-500', icon: Flag },
      activity: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-500', icon: Clock },
      document: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-500', icon: FileText },
      milestone: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-500', icon: Flag },
      billing_event: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-500', icon: DollarSign }
    };
    return styles[nodeType] || styles.activity;
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return badges[status] || badges.completed;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600">Error loading timeline</p>
      </div>
    );
  }

  const nodes = timelineData?.data || [];
  const totals = timelineData?.totals || {};

  return (
    <div className="space-y-6">
      {/* Header with stats and actions */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Case Timeline</h3>
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
              <span>{totals.totalNodes || 0} activities</span>
              <span>{totals.totalHours || 0} hours</span>
              <span className="text-green-600">€{(totals.billedAmount || 0).toFixed(2)} billed</span>
              <span className="text-orange-600">€{(totals.unbilledAmount || 0).toFixed(2)} unbilled</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
            >
              <Filter className="h-4 w-4 mr-1" />
              Filter
            </button>
            
            {hasPermission('timeline:create') && (
              <button
                onClick={handleAddNode}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Activity
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <select
              value={filters.node_type || ''}
              onChange={(e) => setFilters({ ...filters, node_type: e.target.value || undefined })}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All Types</option>
              <option value="registration">Registration</option>
              <option value="legal_classification">Legal Classification</option>
              <option value="activity">Activity</option>
              <option value="document">Document</option>
              <option value="milestone">Milestone</option>
              <option value="billing_event">Billing Event</option>
            </select>

            <select
              value={filters.status || ''}
              onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined })}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              value={filters.is_billed || ''}
              onChange={(e) => setFilters({ ...filters, is_billed: e.target.value || undefined })}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All Billing Status</option>
              <option value="true">Billed</option>
              <option value="false">Unbilled</option>
            </select>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-lg shadow">
        {nodes.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No activities yet</p>
            {hasPermission('timeline:create') && (
              <button
                onClick={handleAddNode}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add First Activity
              </button>
            )}
          </div>
        ) : (
          <div className="p-6">
            <div className="flow-root">
              <ul className="-mb-8">
                {nodes.map((node, index) => {
                  const style = getNodeStyle(node.node_type);
                  const Icon = style.icon;
                  const isLast = index === nodes.length - 1;

                  return (
                    <li key={node.id}>
                      <div className="relative pb-8">
                        {!isLast && (
                          <span
                            className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200"
                            aria-hidden="true"
                          />
                        )}
                        <div className="relative flex items-start space-x-3">
                          {/* Icon */}
                          <div className={`relative px-1`}>
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center ring-8 ring-white ${style.bg}`}>
                              <Icon className={`h-5 w-5 ${style.text}`} />
                            </div>
                          </div>

                          {/* Content */}
                          <div className="min-w-0 flex-1">
                            <div className="bg-gray-50 rounded-lg p-4 border-l-4 ${style.border}">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="text-sm font-semibold text-gray-900">
                                      {node.title}
                                    </h4>
                                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${style.bg} ${style.text}`}>
                                      {node.node_type.replace('_', ' ')}
                                    </span>
                                    {node.activity_type && (
                                      <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                                        {node.activity_type.replace('_', ' ')}
                                      </span>
                                    )}
                                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadge(node.status)}`}>
                                      {node.status}
                                    </span>
                                  </div>
                                  
                                  {node.description && (
                                    <p className="mt-2 text-sm text-gray-600">
                                      {node.description}
                                    </p>
                                  )}

                                  <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
                                    <span>
                                      {format(new Date(node.activity_date), 'MMM d, yyyy h:mm a')}
                                    </span>
                                    {node.hours_worked > 0 && (
                                      <span className="flex items-center">
                                        <Clock className="h-3 w-3 mr-1" />
                                        {node.hours_worked} hours
                                      </span>
                                    )}
                                    {node.billing_amount > 0 && (
                                      <span className={`flex items-center ${node.is_billed ? 'text-green-600' : 'text-orange-600'}`}>
                                        <DollarSign className="h-3 w-3 mr-1" />
                                        €{parseFloat(node.billing_amount).toFixed(2)}
                                        {node.is_billed ? ' (billed)' : ' (unbilled)'}
                                      </span>
                                    )}
                                    {node.creator && (
                                      <span>
                                        by {node.creator.first_name} {node.creator.last_name}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Actions */}
                                {hasPermission('timeline:update') && (
                                  <div className="flex space-x-2 ml-4">
                                    <button
                                      onClick={() => handleEditNode(node)}
                                      className="p-1 text-gray-400 hover:text-blue-600"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteNode(node.id)}
                                      className="p-1 text-gray-400 hover:text-red-600"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <TimelineNodeModal
          dossierId={dossierId}
          node={editingNode}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
};

export default Timeline;