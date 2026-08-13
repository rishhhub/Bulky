import api from './api.js';
import { pincodeService } from './pincodes.js';
import { profileService } from './profile.js';
import { logger } from '../utils/logger.js';

// Helper to get user's cityId from their default address
const getUserCityId = async () => {
  try {
    const addresses = await profileService.getAddresses();
    if (!addresses || addresses.length === 0) {
      return null;
    }
    // Get default address or first address
    const defaultAddress = addresses.find(addr => addr.isDefault) || addresses[0];
    if (!defaultAddress || !defaultAddress.postalCode) {
      return null;
    }
    // Lookup pincode to get cityId
    const pincodeInfo = await pincodeService.lookup(defaultAddress.postalCode);
    return pincodeInfo?.cityId || null;
  } catch (err) {
    logger.error('Failed to get user cityId:', err);
    return null;
  }
};

export const productService = {
  getAll: async (params = {}) => {
    const response = await api.get('/products', { params });
    let products = response.data;
    
    // Enrich products with direct order info if user is authenticated
    try {
      const cityId = await getUserCityId();
      if (cityId && products && products.length > 0) {
        const enrichResponse = await api.post('/api/products/enrich', products, {
          params: { cityId }
        });
        products = enrichResponse.data;
      }
    } catch (err) {
      logger.warn('Failed to enrich products:', err);
      // Continue with unenriched products
    }
    
    return products;
  },

  getAllForAdmin: async () => {
    const response = await api.get('/admin/products');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/products/${id}`);
    let product = response.data;
    
    // Enrich product with direct order info if user is authenticated
    try {
      const cityId = await getUserCityId();
      if (cityId && product) {
        const enrichResponse = await api.post('/api/products/enrich-single', product, {
          params: { cityId }
        });
        product = enrichResponse.data;
      }
    } catch (err) {
      logger.warn('Failed to enrich product:', err);
      // Continue with unenriched product
    }
    
    return product;
  },

  create: async (product) => {
    const response = await api.post('/admin/products', product);
    return response.data;
  },

  update: async (id, product) => {
    const response = await api.put(`/admin/products/${id}`, product);
    return response.data;
  },

  delete: async (id) => {
    await api.delete(`/admin/products/${id}`);
  }
};

export const categoryService = {
  getAll: async (flat = false, admin = false) => {
    const response = await api.get('/categories', { params: { flat, admin } });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/categories/${id}`);
    return response.data;
  },

  create: async (category) => {
    const response = await api.post('/categories', category);
    return response.data;
  },

  update: async (id, category) => {
    const response = await api.put(`/categories/${id}`, category);
    return response.data;
  },

  delete: async (id) => {
    await api.delete(`/categories/${id}`);
  }
};

export const reviewService = {
  getByProductId: async (productId) => {
    const response = await api.get(`/reviews/product/${productId}`);
    return response.data;
  },

  create: async (review) => {
    const response = await api.post('/reviews', review);
    return response.data;
  },

  update: async (id, review) => {
    const response = await api.put(`/reviews/${id}`, review);
    return response.data;
  },

  delete: async (id) => {
    await api.delete(`/reviews/${id}`);
  }
};

export default { productService, categoryService, reviewService };
