import api from './api.js';

/**
 * Transaction history service
 */
export const transactionService = {
  /**
   * Get transactions by Interest ID
   */
  getTransactionsByInterestId: async (interestId) => {
    const response = await api.get(`/admin/transactions/interest/${interestId}`);
    return response.data;
  },

  /**
   * Get transactions by OrderGroup ID
   */
  getTransactionsByOrderGroupId: async (orderGroupId) => {
    const response = await api.get(`/admin/transactions/order-group/${orderGroupId}`);
    return response.data;
  }
};

export default transactionService;
