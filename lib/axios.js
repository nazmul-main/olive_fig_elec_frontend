import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    // We will get token from localStorage since Zustand might not be available in non-component context
    if (typeof window !== 'undefined') {
      const authStore = localStorage.getItem('auth-storage');
      if (authStore) {
        try {
          const { state } = JSON.parse(authStore);
          if (state?.token) {
            config.headers.Authorization = `Bearer ${state.token}`;
          }
        } catch (e) {
          console.error('Error parsing auth token', e);
        }
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
