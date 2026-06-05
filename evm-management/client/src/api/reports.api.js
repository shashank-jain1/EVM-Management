import api from './axiosInstance';

export const reportsApi = {
  dashboard: () => api.get('/reports/dashboard'),
  inventorySummary: (params) => api.get('/reports/inventory-summary', { params }),
  statusBreakdown: () => api.get('/reports/status-breakdown'),
  dispatchHistory: (params) => api.get('/reports/dispatch-history', { params }),
  movementTimeline: (params) => api.get('/reports/movement-timeline', { params }),
  auditLogs: (params) => api.get('/audit', { params }),
  globalSearch: (q) => api.get('/search/global', { params: { q } }),
};

export const referenceApi = {
  getStates: () => api.get('/reference/states'),
  getDistricts: (stateId) => api.get('/reference/districts', { params: { stateId } }),
};
