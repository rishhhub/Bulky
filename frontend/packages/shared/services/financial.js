import api from './api.js';

/**
 * Financial service for accessing financial data and calculations
 */
export const financialService = {
  /**
   * Get financial summary for a specific OrderGroup
   */
  getOrderGroupFinancials: async (orderGroupId) => {
    const response = await api.get(`/admin/financial/order-group/${orderGroupId}`);
    return response.data;
  },

  /**
   * Get overall account balance
   */
  getAccountBalance: async () => {
    const response = await api.get('/admin/financial/account-balance');
    return response.data;
  },

  /**
   * Get financial summaries for all OrderGroups
   */
  getAllOrderGroupFinancials: async () => {
    const response = await api.get('/admin/financial/order-groups');
    return response.data;
  }
};

export default financialService;
