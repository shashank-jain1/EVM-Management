import api from './axiosInstance';

export const dispatchApi = {
  list: (params) => api.get('/dispatch', { params }),
  get: (id) => api.get(`/dispatch/${id}`),
  getPending: () => api.get('/dispatch/pending'),
  create: (data) => api.post('/dispatch', data),
  receive: (id, data) => api.post(`/dispatch/${id}/receive`, data),
  cancel: (id, reason) => api.delete(`/dispatch/${id}`, { data: { reason } }),
};
