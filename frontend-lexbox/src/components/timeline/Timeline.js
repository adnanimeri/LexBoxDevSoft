// ===================================================================
// TIMELINE COMPONENT
// ===================================================================
// src/components/timeline/Timeline.js
import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { 
  Clock, 
  FileText, 
  DollarSign, 
  CheckCircle, 
  AlertCircle, 
  User,
  Edit,
  Trash2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import TimelineNodeModal from './TimelineNodeModal';

/**
 * Timeline component that displays chronological case activities
 * Shows different types of timeline nodes with color coding and expandable details
 */
const Timeline = ({ timeline, loading, dossierId }) => {
  const [selectedNode, setSelectedNode] = useState(null);
  const [showNodeModal, setShowNodeModal] = useState(false);
  const { hasPermission } = useAuth();

  // Node type configuration
  const nodeConfig = {
    registration: {
      icon: User,
      color: 'bg-green-100 text-green-600 border-green-200',
      title: 'Client Registration'
    },
    dossier_assignment: {
      icon: FileText,
      color: 'bg-blue-100 text-blue-600 border-blue-200',
      title: 'Dossier Assignment'
    },
    legal_classification: {
      icon: AlertCircle,
      color: 'bg-purple-100 text-purple-600 border-purple-200',
      title: 'Legal Classification'
    },
    activity: {
      icon: Clock,
      color: 'bg-orange-100 text-orange-600 border-orange-200',
      title: 'Activity'
    },
    document: {
      icon: FileText,
      color: 'bg-yellow-100 text-yellow-600 border-yellow-200',
      title: 'Document'
    },
    process: {
      icon: AlertCircle,
      color: 'bg-red-100 text-red-600 border-red-200',
      title: 'Legal Process'
    },
    billing: {
      icon: DollarSign,
      color: 'bg-indigo-100 text-indigo-600 border-indigo-200',
      title: 'Billing'
    },
    custom: {
      icon: CheckCircle,
      color: 'bg-gray-100 text-gray-600 border-gray-200',
      title: 'Custom'
    }
  };

  /**
   * Handle node click for editing
   */
  const handleNodeClick = (node) => {
    if (hasPermission('timeline:update')) {
      setSelectedNode(node);
      setShowNodeModal(true);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (!timeline || timeline.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p>No timeline activities yet</p>
        <p className="text-sm">Activities will appear here as the case progresses</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flow-root">
        <ul className="-mb-8">
          {timeline.map((node, index) => {
            const config = nodeConfig[node.node_type] || nodeConfig.custom;
            const Icon = config.icon;
            const isLast = index === timeline.length - 1;

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
                    {/* Node icon */}
                    <div className={`
                      relative px-2 py-2 rounded-full border-2 ${config.color}
                      ${hasPermission('timeline:update') ? 'cursor-pointer hover:shadow-md' : ''}
                    `}
                    onClick={() => handleNodeClick(node)}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    {/* Node content */}
                    <div className="flex-1 min-w-0">
                      <div className={`
                        bg-white p-4 rounded-lg shadow border border-gray-200
                        ${hasPermission('timeline:update') ? 'cursor-pointer hover:shadow-md hover:border-gray-300' : ''}
                      `}
                      onClick={() => handleNodeClick(node)}
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">
                              {node.title || config.title}
                            </h4>
                            <p className="text-sm text-gray-500">
                              {formatDistanceToNow(new Date(node.created_at), { addSuffix: true })}
                              {node.created_by_name && ` by ${node.created_by_name}`}
                            </p>
                          </div>
                          
                          {/* Status badge */}
                          <span className={`
                            inline-flex px-2 py-1 text-xs font-medium rounded-full
                            ${node.status === 'completed' 
                              ? 'bg-green-100 text-green-800'
                              : node.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-blue-100 text-blue-800'
                            }
                          `}>
                            {node.status || 'active'}
                          </span>
                        </div>

                        {/* Description */}
                        {node.description && (
                          <p className="text-sm text-gray-700 mb-3">
                            {node.description}
                          </p>
                        )}

                        {/* Additional details */}
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center space-x-4">
                            {/* Hours worked */}
                            {node.hours_worked && (
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                <span>{node.hours_worked}h</span>
                              </div>
                            )}

                            {/* Billing amount */}
                            {node.billing_amount && parseFloat(node.billing_amount) > 0 && (
                              <div className="flex items-center">
                                <DollarSign className="h-4 w-4 mr-1" />
                                <span>€{parseFloat(node.billing_amount).toFixed(2)}</span>
                              </div>
                            )}

                            {/* Document count */}
                            {node.document_count && node.document_count > 0 && (
                              <div className="flex items-center">
                                <FileText className="h-4 w-4 mr-1" />
                                <span>{node.document_count} documents</span>
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          {hasPermission('timeline:update') && (
                            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleNodeClick(node);
                                }}
                                className="p-1 text-gray-400 hover:text-blue-600"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              
                              {hasPermission('timeline:delete') && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Handle delete
                                  }}
                                  className="p-1 text-gray-400 hover:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Scheduled/Due date */}
                        {node.scheduled_date && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <p className="text-xs text-gray-500">
                              Scheduled: {new Date(node.scheduled_date).toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Timeline Node Modal */}
      {showNodeModal && selectedNode && (
        <TimelineNodeModal
          isOpen={showNodeModal}
          onClose={() => {
            setShowNodeModal(false);
            setSelectedNode(null);
          }}
          node={selectedNode}
          dossierId={dossierId}
          mode="edit"
        />
      )}
    </div>
  );
};

export default Timeline;