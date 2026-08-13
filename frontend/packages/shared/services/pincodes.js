import api from './api.js';

export const pincodeService = {
  lookup: async (pincode) => {
    const response = await api.get(`/pincodes/${pincode}`);
    return response.data;
  },

  getServiceable: async () => {
    const response = await api.get('/pincodes/serviceable');
    return response.data;
  },

  getStates: async () => {
    const response = await api.get('/pincodes/states');
    return response.data;
  },

  getCities: async (stateId = null) => {
    const url = stateId ? `/pincodes/cities?stateId=${stateId}` : '/pincodes/cities';
    const response = await api.get(url);
    return response.data;
  },

  getPincodesByCity: async (cityId) => {
    const response = await api.get(`/pincodes/cities/${cityId}/pincodes`);
    return response.data;
  },

  // Admin methods
  getAllPincodes: async (cityId = null, serviceable = null) => {
    const params = new URLSearchParams();
    if (cityId) params.append('cityId', cityId);
    if (serviceable !== null) params.append('serviceable', serviceable);
    const url = `/admin/pincodes${params.toString() ? '?' + params.toString() : ''}`;
    const response = await api.get(url);
    return response.data;
  },

  createPincode: async (pincode) => {
    const response = await api.post('/admin/pincodes', pincode);
    return response.data;
  },

  updatePincode: async (id, pincode) => {
    const response = await api.put(`/admin/pincodes/${id}`, pincode);
    return response.data;
  },

  bulkImportPincodes: async (pincodes) => {
    const response = await api.post('/admin/pincodes/bulk-import', pincodes);
    return response.data;
  },

  markCityServiceable: async (cityId) => {
    const response = await api.post(`/admin/pincodes/cities/${cityId}/mark-serviceable`);
    return response.data;
  },

  // State admin methods
  getAllStates: async () => {
    const response = await api.get('/admin/states');
    return response.data;
  },

  createState: async (state) => {
    const response = await api.post('/admin/states', state);
    return response.data;
  },

  updateState: async (id, state) => {
    const response = await api.put(`/admin/states/${id}`, state);
    return response.data;
  },

  // City admin methods
  getAllCities: async (stateId = null) => {
    const url = stateId ? `/admin/cities?stateId=${stateId}` : '/admin/cities';
    const response = await api.get(url);
    return response.data;
  },

  createCity: async (city) => {
    const response = await api.post('/admin/cities', city);
    return response.data;
  },

  updateCity: async (id, city) => {
    const response = await api.put(`/admin/cities/${id}`, city);
    return response.data;
  }
};

export default pincodeService;
