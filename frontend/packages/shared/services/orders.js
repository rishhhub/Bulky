import api from './api.js';

export const orderService = {
  // Interests
  getMyInterests: async () => {
    const response = await api.get('/interests/my');
    return response.data;
  },

  createInterest: async (interestData) => {
    const response = await api.post('/interests', interestData);
    return response.data;
  },

  extendInterest: async (id, periodDays) => {
    const response = await api.post(`/interests/${id}/extend`, { periodDays });
    return response.data;
  },

  withdrawInterest: async (id) => {
    await api.post(`/interests/${id}/withdraw`);
  },

  updateInterest: async (id, interestData) => {
    const response = await api.put(`/interests/${id}`, interestData);
    return response.data;
  },

  getInterestById: async (id) => {
    const response = await api.get(`/interests/${id}`);
    return response.data;
  },

  // Order Groups (Admin)
  getAllOrderGroups: async () => {
    const response = await api.get('/admin/order-groups');
    return response.data;
  },

  getOrderGroupDetails: async (id) => {
    const response = await api.get(`/admin/order-groups/${id}/details`);
    return response.data;
  },

  getOrderGroupsByStatus: async (status) => {
    const response = await api.get('/admin/order-groups', { params: { status } });
    return response.data;
  },

  getPendingInterests: async () => {
    const response = await api.get('/admin/pending-interests');
    return response.data;
  },

  placeOrderWithSeller: async (orderGroupId, orderData) => {
    const response = await api.post(`/admin/order-groups/${orderGroupId}/place-order`, orderData);
    return response.data;
  },

  // Seller Orders
  getSellerOrdersByOrderGroup: async (orderGroupId) => {
    const response = await api.get(`/admin/order-groups/${orderGroupId}/seller-order`);
    // API returns a single object or null
    return response.data;
  },

  getAllSellerOrders: async () => {
    const response = await api.get('/admin/seller-orders');
    return response.data;
  },

  updateSellerOrderTracking: async (sellerOrderId, trackingData) => {
    const response = await api.put(`/admin/seller-orders/${sellerOrderId}/tracking`, trackingData);
    return response.data;
  },

  markOrderArrived: async (sellerOrderId) => {
    await api.post(`/admin/seller-orders/${sellerOrderId}/mark-arrived`);
  },

  // Interest actions (Admin)
  markPickedUp: async (interestId) => {
    await api.post(`/admin/interests/${interestId}/mark-picked-up`);
  },

  markDelivered: async (interestId, deliveryTrackingId) => {
    await api.post(`/admin/interests/${interestId}/mark-delivered`, { deliveryTrackingId });
  },

  getSellerOrdersByWarehouse: async (warehouseId) => {
    const response = await api.get(`/admin/warehouses/${warehouseId}/seller-orders`);
    return response.data;
  },

  // Orders (new - when Interest becomes Order)
  getMyOrders: async () => {
    const response = await api.get('/orders/my');
    return response.data;
  },

  getOrderById: async (orderId) => {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  },

  getOrderByOrderNumber: async (orderNumber) => {
    const response = await api.get(`/orders/number/${orderNumber}`);
    return response.data;
  },

  getOrderByInterestId: async (interestId) => {
    const response = await api.get(`/orders/interest/${interestId}`);
    return response.data;
  },

  // Admin: Get orders by OrderGroup
  getOrdersByOrderGroup: async (orderGroupId) => {
    const response = await api.get(`/admin/order-groups/${orderGroupId}/orders`);
    return response.data;
  },

  // Admin: Get orders by SellerOrder
  getOrdersBySellerOrder: async (sellerOrderId) => {
    const response = await api.get(`/admin/seller-orders/${sellerOrderId}/orders`);
    return response.data;
  },

  // Seller: Get seller orders
  getMySellerOrders: async () => {
    const response = await api.get('/seller/orders');
    return response.data;
  },

  getSellerOrderById: async (sellerOrderId) => {
    const response = await api.get(`/seller/orders/${sellerOrderId}`);
    return response.data;
  },

  // Seller: Update fulfillment (confirm or mark shipped)
  updateSellerOrderFulfillment: async (sellerOrderId, data) => {
    const response = await api.put(`/seller/orders/${sellerOrderId}/fulfillment`, data);
    return response.data;
  }
};

export default orderService;
