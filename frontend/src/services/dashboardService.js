import api from './api';

export const dashboardService = {
  getAgentStats: () => api.get('/dashboard/agent'),
};
