import api from './api.js';

export const chatService = {
  async getRooms() {
    const response = await api.get('/chat/rooms');
    return response.data;
  },

  async getMessages(roomId, page = 1) {
    const response = await api.get(`/chat/rooms/${roomId}/messages`, {
      params: { page },
    });
    return response.data;
  },

  async sendImage(roomId, file) {
    const formData = new FormData();
    formData.append('image', file);
    const response = await api.post(`/chat/rooms/${roomId}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async deleteRoom(roomId) {
    const response = await api.delete(`/chat/rooms/${roomId}`);
    return response.data;
  },
};
