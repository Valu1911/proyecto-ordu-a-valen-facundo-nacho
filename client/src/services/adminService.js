import api from './api.js';

export const adminService = {
  async getDashboard() {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },

  async getUsers(params = {}) {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  async banUser(id, data) {
    const response = await api.post(`/admin/users/${id}/ban`, data);
    return response.data;
  },

  async unbanUser(id, data) {
    const response = await api.post(`/admin/users/${id}/unban`, data);
    return response.data;
  },

  async getReports(params = {}) {
    const response = await api.get('/admin/reports', { params });
    return response.data;
  },

  async resolveReport(id, data) {
    const response = await api.put(`/admin/reports/${id}`, data);
    return response.data;
  },

  async getActivityLog(params = {}) {
    const response = await api.get('/admin/activity-log', { params });
    return response.data;
  },
};
