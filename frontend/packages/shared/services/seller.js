import api from './api.js';

export const sellerService = {
  /**
   * Register current user as a seller
   */
  registerAsSeller: async (sellerProfileData) => {
    const response = await api.post('/seller/register', sellerProfileData);
    return response.data;
  },

  /**
   * Get seller profile for current user
   */
  getSellerProfile: async () => {
    const response = await api.get('/seller/profile');
    return response.data;
  },

  /**
   * Update seller profile for current user
   */
  updateSellerProfile: async (sellerProfileData) => {
    const response = await api.put('/seller/profile', sellerProfileData);
    return response.data;
  },

  /**
   * Get seller status for current user
   */
  getSellerStatus: async () => {
    const response = await api.get('/seller/status');
    return response.data;
  },

  /**
   * Get all sellers (admin only)
   */
  getAllSellers: async () => {
    const response = await api.get('/admin/sellers');
    return response.data;
  },

  /**
   * Approve seller (admin only)
   */
  approveSeller: async (sellerId, adminId) => {
    const response = await api.post(`/admin/sellers/${sellerId}/approve`);
    return response.data;
  },

  /**
   * Reject seller (admin only)
   */
  rejectSeller: async (sellerId, adminId, rejectionReason) => {
    const response = await api.post(`/admin/sellers/${sellerId}/reject`, {
      rejectionReason
    });
    return response.data;
  }
};
