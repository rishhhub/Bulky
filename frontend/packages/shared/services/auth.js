import api from './api.js';

export const authService = {
  // OTP Registration
  sendRegistrationOtp: async (contactValue, contactType) => {
    const response = await api.post('/auth/otp/send', {
      contactValue,
      contactType: contactType || (contactValue.includes('@') ? 'EMAIL' : 'PHONE')
    });
    return response.data;
  },

  registerWithOtp: async (firstName, middleName, lastName, contactValue, contactType, otp) => {
    const response = await api.post('/auth/register/otp', {
      firstName,
      middleName: middleName && middleName.trim() ? middleName.trim() : null,
      lastName,
      contactValue,
      contactType: contactType || (contactValue.includes('@') ? 'EMAIL' : 'PHONE'),
      otp
    });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      // Store only minimal user data (id, name fields, role) - not full user object with email/phone
      const minimalUser = {
        id: response.data.id, // User ID needed for ownership checks (not sensitive PII)
        firstName: response.data.firstName,
        middleName: response.data.middleName,
        lastName: response.data.lastName,
        fullName: response.data.fullName,
        role: response.data.role
      };
      localStorage.setItem('user', JSON.stringify(minimalUser));
    }
    return response.data;
  },

  // OTP Login
  sendLoginOtp: async (contactValue, contactType) => {
    const response = await api.post('/auth/login/otp/send', {
      contactValue,
      contactType: contactType || (contactValue.includes('@') ? 'EMAIL' : 'PHONE')
    });
    return response.data;
  },

  loginWithOtp: async (contactValue, contactType, otp) => {
    const response = await api.post('/auth/login/otp', {
      contactValue,
      contactType: contactType || (contactValue.includes('@') ? 'EMAIL' : 'PHONE'),
      otp
    });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      // Store only minimal user data (id, name fields, role) - not full user object with email/phone
      const minimalUser = {
        id: response.data.id, // User ID needed for ownership checks (not sensitive PII)
        firstName: response.data.firstName,
        middleName: response.data.middleName,
        lastName: response.data.lastName,
        fullName: response.data.fullName,
        role: response.data.role
      };
      localStorage.setItem('user', JSON.stringify(minimalUser));
    }
    return response.data;
  },

  // Legacy password-based registration
  register: async (email, password, name) => {
    const response = await api.post('/auth/register', { email, password, name });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      // Store only minimal user data (id, name fields, role) - not full user object with email/phone
      const minimalUser = {
        id: response.data.id, // User ID needed for ownership checks (not sensitive PII)
        firstName: response.data.firstName,
        middleName: response.data.middleName,
        lastName: response.data.lastName,
        fullName: response.data.fullName,
        role: response.data.role
      };
      localStorage.setItem('user', JSON.stringify(minimalUser));
    }
    return response.data;
  },

  // Password-based login
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      // Store only minimal user data (id, name fields, role) - not full user object with email/phone
      const minimalUser = {
        id: response.data.id, // User ID needed for ownership checks (not sensitive PII)
        firstName: response.data.firstName,
        middleName: response.data.middleName,
        lastName: response.data.lastName,
        fullName: response.data.fullName,
        role: response.data.role
      };
      localStorage.setItem('user', JSON.stringify(minimalUser));
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  }
};

export default authService;
