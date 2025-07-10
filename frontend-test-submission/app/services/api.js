import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for HTTP-only cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor to handle auth errors (but don't auto-redirect)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - could redirect to login or show message
      console.log('Unauthorized access - please log in');
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: async (userData) => {
    const response = await api.post('/api/auth/register', userData);
    return response.data;
  },

  login: async (credentials) => {
    const response = await api.post('/api/auth/login', credentials);
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/api/auth/logout');
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/api/auth/profile');
    return response.data;
  },

  // Check if user is authenticated without making a full profile request
  checkAuth: async () => {
    try {
      const response = await api.get('/api/auth/profile');
      return { isAuthenticated: true, user: response.data.user };
    } catch (error) {
      return { isAuthenticated: false, user: null };
    }
  },
};

// URL API
export const urlAPI = {
  createShortURL: async (urlData) => {
    const response = await api.post('/shorturls', urlData);
    return response.data;
  },

  getStats: async (shortcode) => {
    const response = await api.get(`/shorturls/${shortcode}`);
    return response.data;
  },

  updateShortURL: async (id, data) => {
    const response = await api.put(`/shorturls/id/${id}`, data,{withCredentials:true});
    return response.data;
  },

  deleteURL: async (id) => {
    const response = await api.delete(`/shorturls/id/${id}`,{withCredentials:true} );
    return response.data;
  },

  checkURLSecurity: async (url) => {
    const response = await api.post('/check-security', { url });
    return response.data;
  },

  debugShortURL: async (shortcode) => {
    const response = await api.get(`/debug/${shortcode}`);
    return response.data;
  },

  debugShortURLById: async (id) => {
    const response = await api.get(`/debug/id/${id}`);
    return response.data;
  },
};

export default api; 