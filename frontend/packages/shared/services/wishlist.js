import api from './api';

const wishlistService = {
  /**
   * Add product to wishlist
   * @param {number} productId - Product ID
   * @returns {Promise<Object>} Wishlist item
   */
  async addToWishlist(productId) {
    const response = await api.post('/wishlist', null, {
      params: { productId }
    });
    return response.data;
  },

  /**
   * Remove product from wishlist
   * @param {number} productId - Product ID
   * @returns {Promise<void>}
   */
  async removeFromWishlist(productId) {
    await api.delete(`/wishlist/${productId}`);
  },

  /**
   * Get user's wishlist
   * @returns {Promise<Array>} List of wishlist items
   */
  async getWishlist() {
    const response = await api.get('/wishlist');
    return response.data;
  },

  /**
   * Check if product is in wishlist
   * @param {number} productId - Product ID
   * @returns {Promise<boolean>} True if in wishlist
   */
  async isInWishlist(productId) {
    try {
      const response = await api.get(`/wishlist/${productId}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return false;
      }
      throw error;
    }
  }
};

export default wishlistService;
