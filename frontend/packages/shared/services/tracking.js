import api from './api.js';

/**
 * Tracking service for order tracking information
 */
export const trackingService = {
  /**
   * Get tracking by Interest ID
   */
  getTrackingByInterestId: async (interestId) => {
    const response = await api.get(`/tracking/interest/${interestId}`);
    return response.data;
  },

  /**
   * Get tracking by Order ID
   */
  getTrackingByOrderId: async (orderId) => {
    const response = await api.get(`/tracking/order/${orderId}`);
    return response.data;
  },

  /**
   * Get tracking by Seller Order ID
   */
  getTrackingBySellerOrderId: async (sellerOrderId) => {
    const response = await api.get(`/tracking/seller-order/${sellerOrderId}`);
    return response.data;
  },

  /**
   * Get current tracking status for an Interest
   */
  getCurrentTrackingStatus: async (interestId) => {
    const response = await api.get(`/tracking/interest/${interestId}/current`);
    return response.data;
  }
};

export default trackingService;
