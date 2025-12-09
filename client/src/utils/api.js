import axios from 'axios';
import { extractErrorMessage } from './errorHandler';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
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

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't redirect on 401 during login/register - let the component handle it
    const isAuthRoute = error.config?.url?.includes('/auth/login') || 
                       error.config?.url?.includes('/auth/register');
    
    if (error.response?.status === 401 && !isAuthRoute) {
      // Only redirect if not on auth routes
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Use window.location only if we're not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    // Enhance error with extracted message for easier handling
    const errorInfo = extractErrorMessage(error);
    error.userMessage = errorInfo.message;
    error.errorTitle = errorInfo.title;
    error.errorType = errorInfo.type;
    
    return Promise.reject(error);
  }
);

export default api;

