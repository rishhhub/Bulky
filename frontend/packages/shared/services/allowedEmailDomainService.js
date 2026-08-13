import api from './api.js';

export const allowedEmailDomainService = {
  getAllAllowedDomains: async () => {
    const response = await api.get('/admin/allowed-email-domains');
    return response.data;
  },

  getActiveAllowedDomains: async () => {
    const response = await api.get('/admin/allowed-email-domains/active');
    return response.data;
  },

  createAllowedDomain: async (domainData) => {
    const response = await api.post('/admin/allowed-email-domains', domainData);
    return response.data;
  },

  updateAllowedDomain: async (id, domainData) => {
    const response = await api.put(`/admin/allowed-email-domains/${id}`, domainData);
    return response.data;
  },

  deleteAllowedDomain: async (id) => {
    await api.delete(`/admin/allowed-email-domains/${id}`);
  }
};

export default allowedEmailDomainService;
