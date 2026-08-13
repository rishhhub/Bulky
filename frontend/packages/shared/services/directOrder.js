import api from './api';

const directOrderService = {
  /**
   * Place a direct order
   * @param {Object} orderData - Order data including orderGroupId, quantity, logisticsPreference, etc.
   * @returns {Promise<Object>} Created interest/order
   */
  async placeDirectOrder(orderData) {
    const response = await api.post('/direct-order', orderData);
    return response.data;
  }
};

export default directOrderService;
