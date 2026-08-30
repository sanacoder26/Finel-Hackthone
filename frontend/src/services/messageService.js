import api from './api';

export const messageService = {
  getMessages: (ticketId) => api.get(`/tickets/${ticketId}/messages`),
  sendMessage: (ticketId, payload) => api.post(`/tickets/${ticketId}/messages`, payload),
};
