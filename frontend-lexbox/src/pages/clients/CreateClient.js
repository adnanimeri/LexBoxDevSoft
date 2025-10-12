// ===================================================================
// CREATE CLIENT PAGE
// ===================================================================
// src/pages/clients/CreateClient.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Save, User } from 'lucide-react';
import { clientService } from '../../services/clientService';
import { useNotification } from '../../context/NotificationContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';

/**
 * Create new client page with form validation
 * Handles initial client registration with optional document upload
 */
const CreateClient = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm({
    defaultValues: {
      first_name: '',
      last_name: '',
      personal_number: '',
      email: '',
      phone: '',
      address: '',
      notes: '',
      dossier_number: ''
    }
  });

  // Create client mutation
  /*const createClientMutation = useMutation(
    (clientData) => clientService.createClient(clientData),
    {
      onSuccess: (data) => {
        showSuccess('Client created successfully');
        navigate(`/clients/${data.id}`);
      },
      onError: (error) => {
        showError(error.response?.data?.message || 'Failed to create client');
      }
    }
  );*/
  const createClientMutation = useMutation({
  mutationFn: (clientData) => clientService.createClient(clientData),
  onSuccess: (data) => {
    showSuccess('Client created successfully');
    navigate(`/clients/${data.id}`);
  },
  onError: (error) => {
    showError(error.response?.data?.message || 'Failed to create client');
  }
});

  /**
   * Handle form submission
   */
  const onSubmit = (data) => {
    // Clean up empty fields
    const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
      if (value && value.trim() !== '') {
        acc[key] = value.trim();
      }
      return acc;
    }, {});

    createClientMutation.mutate(cleanData);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <Link
          to="/clients"
          className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        >
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Client</h1>
          <p className="text-gray-600">Register a new client in the system</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Basic Information
            </h3>
          </div>
          
          <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  {...register('first_name', { 
                    required: 'First name is required',
                    minLength: { value: 2, message: 'First name must be at least 2 characters' }
                  })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.first_name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter first name"
                />
                {errors.first_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.first_name.message}</p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  {...register('last_name', { 
                    required: 'Last name is required',
                    minLength: { value: 2, message: 'Last name must be at least 2 characters' }
                  })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.last_name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter last name"
                />
                {errors.last_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.last_name.message}</p>
                )}
              </div>
            </div>

            {/* Personal Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Personal Number
              </label>
              <input
                type="text"
                {...register('personal_number', {
                  pattern: {
                    value: /^[A-Za-z0-9]{8,15}$/,
                    message: 'Personal number must be 8-15 alphanumeric characters'
                  }
                })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.personal_number ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter personal identification number"
              />
              {errors.personal_number && (
                <p className="mt-1 text-sm text-red-600">{errors.personal_number.message}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Optional: Used for client identification and search
              </p>
            </div>

            {/* Dossier Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dossier Number (Numrin e Landes)
              </label>
              <input
                type="text"
                {...register('dossier_number')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter dossier number if available"
              />
              <p className="mt-1 text-sm text-gray-500">
                Optional: Can be assigned later when received
              </p>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Contact Information</h3>
          </div>
          
          <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  {...register('email', {
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter email address"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  {...register('phone', {
                    pattern: {
                      value: /^[+]?[\d\s\-\(\)]+$/,
                      message: 'Invalid phone number format'
                    }
                  })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.phone ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter phone number"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                )}
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <textarea
                rows="3"
                {...register('address')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter full address"
              />
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Additional Information</h3>
          </div>
          
          <div className="px-6 py-4">
            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                rows="4"
                {...register('notes')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Additional notes about the client..."
              />
              <p className="mt-1 text-sm text-gray-500">
                Any relevant information about the client or case
              </p>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pb-8">
          <Link
            to="/clients"
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={createClientMutation.isLoading}
            className="inline-flex items-center px-6 py-2 border border-transparent text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createClientMutation.isLoading ? (
              <LoadingSpinner size="sm" className="mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Create Client
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateClient;