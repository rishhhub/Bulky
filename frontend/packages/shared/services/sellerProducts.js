import api from './api.js';

export const sellerProductService = {
  /**
   * Create a product for the current seller
   */
  createProduct: async (productData) => {
    const response = await api.post('/seller/products', productData);
    return response.data;
  },

  /**
   * Get all products for the current seller
   */
  getSellerProducts: async () => {
    const response = await api.get('/seller/products');
    return response.data;
  },

  /**
   * Update a product for the current seller
   */
  updateProduct: async (productId, productData) => {
    const response = await api.put(`/seller/products/${productId}`, productData);
    return response.data;
  },

  /**
   * Delete a product for the current seller
   */
  deleteProduct: async (productId) => {
    await api.delete(`/seller/products/${productId}`);
  },

  /**
   * Calculate and preview the listed price
   */
  calculatePrice: async (costPerUnit, deliveryCostPerMinOrder, minOrderQuantity) => {
    const response = await api.post('/seller/products/calculate-price', null, {
      params: {
        costPerUnit,
        deliveryCostPerMinOrder,
        minOrderQuantity
      }
    });
    return response.data;
  },

  /**
   * Get all pending product approvals (admin only)
   */
  getPendingProductApprovals: async () => {
    const response = await api.get('/admin/seller-products/pending');
    return response.data;
  },

  /**
   * Approve a seller product (admin only)
   */
  approveProduct: async (productId, adminId) => {
    const response = await api.post(`/admin/seller-products/${productId}/approve`);
    return response.data;
  },

  /**
   * Reject a seller product (admin only)
   */
  rejectProduct: async (productId, adminId, rejectionReason) => {
    const response = await api.post(`/admin/seller-products/${productId}/reject`, {
      rejectionReason
    });
    return response.data;
  }
};
