import apiClient from './apiService';

export const calendarService = {
  getEvents: (params = {}) =>
    apiClient.get('/calendar/events', { params }),

  getUpcoming: () =>
    apiClient.get('/calendar/upcoming'),

  createEvent: (data) =>
    apiClient.post('/calendar/events', data),

  updateEvent: (id, data) =>
    apiClient.put(`/calendar/events/${id}`, data),

  deleteEvent: (id) =>
    apiClient.delete(`/calendar/events/${id}`)
};
