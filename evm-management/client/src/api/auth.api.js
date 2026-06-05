import api from './axiosInstance';

export const authApi = {
  login: (userCode, password) =>
    api.post('/auth/login', { userCode, password }),

  logout: (refreshToken) =>
    api.post('/auth/logout', { refreshToken }),

  refresh: (refreshToken) =>
    api.post('/auth/refresh', { refreshToken }),

  me: () => api.get('/auth/me'),
};
