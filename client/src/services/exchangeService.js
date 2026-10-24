import api from './api.js';

export const exchangeService = {
  async requestExchange(product_requested_id, product_offered_id = null) {
    const response = await api.post('/exchanges', {
      product_requested_id,
      product_offered_id,
    });
    return response.data;
  },

  async getMyExchanges() {
    const response = await api.get('/exchanges/my');
    return response.data;
  },

  async getExchangeById(id) {
    const response = await api.get(`/exchanges/${id}`);
    return response.data;
  },

  async acceptExchange(id) {
    const response = await api.put(`/exchanges/${id}/accept`);
    return response.data;
  },

  async rejectExchange(id) {
    const response = await api.put(`/exchanges/${id}/reject`);
    return response.data;
  },

  async formalizeExchange(id) {
    const response = await api.put(`/exchanges/${id}/formalize`);
    return response.data;
  },

  async confirmExchange(id, code) {
    const response = await api.put(`/exchanges/${id}/confirm`, { code });
    return response.data;
  },

  async cancelExchange(id) {
    const response = await api.put(`/exchanges/${id}/cancel`);
    return response.data;
  },
};
