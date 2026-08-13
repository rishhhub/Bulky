import api from './api.js';

export const profileService = {
  // Profile
  getProfile: async () => {
    const response = await api.get('/profile');
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await api.put('/profile', profileData);
    return response.data;
  },

  setPassword: async (password) => {
    const response = await api.post('/profile/password', { password });
    return response.data;
  },

  // Contacts
  getContacts: async () => {
    const response = await api.get('/profile/contacts');
    return response.data;
  },

  sendContactOtp: async (contactValue, contactType) => {
    const response = await api.post('/profile/contacts/otp/send', null, {
      params: { contactValue, contactType }
    });
    return response.data;
  },

  verifyContactOtp: async (contactValue, otp) => {
    const response = await api.post('/profile/contacts/otp/verify', null, {
      params: { contactValue, otp }
    });
    return response.data;
  },

  addContact: async (contactData) => {
    const response = await api.post('/profile/contacts', contactData);
    return response.data;
  },

  updateContact: async (contactId, contactData) => {
    const response = await api.put(`/profile/contacts/${contactId}`, contactData);
    return response.data;
  },

  deleteContact: async (contactId) => {
    const response = await api.delete(`/profile/contacts/${contactId}`);
    return response.data;
  },

  // Addresses
  getAddresses: async () => {
    const response = await api.get('/profile/addresses');
    return response.data;
  },

  addAddress: async (addressData) => {
    const response = await api.post('/profile/addresses', addressData);
    return response.data;
  },

  updateAddress: async (addressId, addressData) => {
    const response = await api.put(`/profile/addresses/${addressId}`, addressData);
    return response.data;
  },

  deleteAddress: async (addressId) => {
    const response = await api.delete(`/profile/addresses/${addressId}`);
    return response.data;
  },

  // Payment Methods
  getPaymentMethods: async () => {
    const response = await api.get('/profile/payment-methods');
    return response.data;
  },

  addPaymentMethod: async (paymentMethodData) => {
    const response = await api.post('/profile/payment-methods', paymentMethodData);
    return response.data;
  },

  updatePaymentMethod: async (paymentMethodId, paymentMethodData) => {
    const response = await api.put(`/profile/payment-methods/${paymentMethodId}`, paymentMethodData);
    return response.data;
  },

  deletePaymentMethod: async (paymentMethodId) => {
    const response = await api.delete(`/profile/payment-methods/${paymentMethodId}`);
    return response.data;
  },

  // Login Methods
  updateLoginMethods: async (loginMethods) => {
    const response = await api.put('/profile/login-methods', { loginMethods });
    return response.data;
  }
};

export default profileService;
