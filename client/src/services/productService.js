import api from './api.js';
import { interestTracker } from '../utils/interestTracker.js';

export const productService = {
  async getProducts(params = {}) {
    const response = await api.get('/products', { params });
    return response.data;
  },

  async getProductById(id) {
    const response = await api.get(`/products/${id}`);
    if (response.data?.product) {
      interestTracker.recordProductView(response.data.product);
    }
    return response.data;
  },

  async createProduct(data) {
    const response = await api.post('/products', data);
    return response.data;
  },

  async updateProduct(id, data) {
    const response = await api.put(`/products/${id}`, data);
    return response.data;
  },

  async deleteProduct(id) {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },

  async getNearbyProducts(lat, lng, radius = 50) {
    const response = await api.get('/products/nearby', {
      params: { lat, lng, radius },
    });
    return response.data;
  },

  async getUserProducts(userId) {
    const response = await api.get(`/products/user/${userId}`);
    return response.data;
  },

  async getProductRecommendations(id, params = {}) {
    const response = await api.get(`/products/${id}/recommendations`, { params });
    return response.data;
  },

  async getPersonalizedRecommendations(params = {}) {
    const topStyle = interestTracker.getTopStyle();
    const searches = interestTracker.getRecentSearches();
    const mergedParams = {
      style: topStyle,
      keywords: searches.slice(0, 3).join(' '),
      ...params,
    };
    const response = await api.get('/products/recommendations/personalized', { params: mergedParams });
    return response.data;
  },
};
