import axios from 'axios';

// Backend has context-path: /api, so we don't need to prefix with /api
// The proxy in vite.config.js handles /api -> http://localhost:8080/api
const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401/403 responses and clear invalid tokens
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only log out on 401 (Unauthorized - invalid/missing token)
    // For 403 (Forbidden - insufficient permissions), let the calling code handle it
    // unless it's a critical authentication failure
    if (error.response?.status === 401) {
      // 401 means invalid or expired token - definitely log out
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Only redirect if not already on login/register page
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }
    // For 403, we don't automatically log out - it might just be a permission issue
    // The calling code should handle 403 errors appropriately
    return Promise.reject(error);
  }
);

export default api;
