import api from './api.js';

export const notificationService = {
  getUserNotifications: async () => {
    const response = await api.get('/notifications');
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },

  markAsRead: async (notificationId) => {
    await api.post(`/notifications/${notificationId}/read`);
  },

  markAllAsRead: async () => {
    await api.post('/notifications/mark-all-read');
  }
};

export default notificationService;
