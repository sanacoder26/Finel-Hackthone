import api from './api';

export const ticketService = {
  getMyTickets: () => api.get('/tickets/my'),
  getAgentTickets: () => api.get('/tickets/agent'),
  createTicket: (payload) => api.post('/tickets', payload),
  getTicketById: (id) => api.get(`/tickets/${id}`),
  claimTicket: (id) => api.patch(`/tickets/${id}/claim`),
  updateTriage: (id, payload) => api.patch(`/tickets/${id}/triage`, payload),
  updateStatus: (id, status) => api.patch(`/tickets/${id}/status`, { status }),
  resolveTicket: (id, resolutionNote) => api.patch(`/tickets/${id}/resolve`, { resolutionNote }),
};
