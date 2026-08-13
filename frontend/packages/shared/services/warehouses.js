import api from './api.js';

export const warehouseService = {
  getAllActive: async () => {
    const response = await api.get('/warehouses');
    return response.data;
  },

  getAll: async () => {
    const response = await api.get('/admin/warehouses');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/warehouses/${id}`);
    return response.data;
  },

  create: async (warehouse) => {
    const response = await api.post('/admin/warehouses', warehouse);
    return response.data;
  },

  update: async (id, warehouse) => {
    const response = await api.put(`/admin/warehouses/${id}`, warehouse);
    return response.data;
  },

  delete: async (id) => {
    await api.delete(`/admin/warehouses/${id}`);
  },

  calculateDeliveryCost: async (request) => {
    const response = await api.post('/logistics/calculate', request);
    return response.data;
  },

  getSellerOrdersByWarehouse: async (warehouseId) => {
    const response = await api.get(`/admin/warehouses/${warehouseId}/seller-orders`);
    return response.data;
  }
};

export default warehouseService;
