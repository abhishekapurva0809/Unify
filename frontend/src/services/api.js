import axios from 'axios';

/**
 * Centralized Axios HTTP Client Configuration
 * Uses environment variable VITE_API_BASE_URL (defaults to http://localhost:8090/api/v1)
 */
const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8090/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor
 * Automatically attaches Authorization header with Bearer token if user is logged in
 */
API.interceptors.request.use(
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

/**
 * Response Interceptor
 * Intercepts responses and handles global 401 Unauthorized errors (token expiration)
 */
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and user storage if token is invalid or expired
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');

      // Only redirect if not already on authentication pages
      if (
        window.location.pathname !== '/login' &&
        window.location.pathname !== '/register' &&
        window.location.pathname !== '/'
      ) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default API;
