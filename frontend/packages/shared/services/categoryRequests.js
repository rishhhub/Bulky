import api from './api.js';

export const categoryRequestService = {
  /**
   * Request a new category (seller)
   */
  requestCategory: async (categoryName, description) => {
    const response = await api.post('/seller/category-requests', {
      categoryName,
      description
    });
    return response.data;
  },

  /**
   * Get all category requests for current seller
   */
  getSellerRequests: async () => {
    const response = await api.get('/seller/category-requests');
    return response.data;
  },

  /**
   * Get all pending category requests (admin)
   */
  getAllRequests: async () => {
    const response = await api.get('/admin/category-requests');
    return response.data;
  },

  /**
   * Approve a category request (admin)
   */
  approveRequest: async (requestId) => {
    const response = await api.post(`/admin/category-requests/${requestId}/approve`);
    return response.data;
  },

  /**
   * Reject a category request (admin)
   */
  rejectRequest: async (requestId, rejectionReason) => {
    const response = await api.post(`/admin/category-requests/${requestId}/reject`, {
      rejectionReason
    });
    return response.data;
  }
};
