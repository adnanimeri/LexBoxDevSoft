// src/services/authService.js
   import apiClient from './apiService';

   export const authService = {
     login: async (email, password) => {
       const response = await apiClient.post('/auth/login', { email, password });
       return response.data;
     },

     getCurrentUser: async () => {
       const response = await apiClient.get('/auth/me');
       return response.data;
     },

     logout: async () => {
       try {
         await apiClient.post('/auth/logout');
       } catch (error) {
         // Handle logout error
       }
     },

     refreshToken: async () => {
       const response = await apiClient.post('/auth/refresh');
       return response.data;
     }
   };