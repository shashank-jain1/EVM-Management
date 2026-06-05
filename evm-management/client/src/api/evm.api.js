import api from './axiosInstance';

export const evmApi = {
  list: (params) => api.get('/evm', { params }),
  get: (id) => api.get(`/evm/${id}`),
  getHistory: (id) => api.get(`/evm/${id}/history`),
  lookup: (code) => api.get(`/evm/lookup/${encodeURIComponent(code)}`),
  register: (data) => api.post('/evm', data),
  updateStatus: (id, data) => api.patch(`/evm/${id}/status`, data),
};
