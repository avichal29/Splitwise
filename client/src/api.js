import axios from 'axios';
import { getCachedResponse, setCachedResponse, addToSyncQueue } from './lib/offlineDb';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    // Cache successful GET responses in IndexedDB
    if (response.config.method === 'get') {
      const url = response.config.url;
      setCachedResponse(url, response.data);
    }
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // Network error — we're offline
    if (!error.response && !navigator.onLine) {
      const config = error.config;

      // For GET requests: return cached data
      if (config.method === 'get') {
        const cached = await getCachedResponse(config.url);
        if (cached) {
          return { data: cached, status: 200, _fromCache: true };
        }
      }

      // For mutations: queue them for later sync
      if (['post', 'put', 'delete'].includes(config.method)) {
        await addToSyncQueue({
          method: config.method,
          url: config.url,
          data: config.data ? JSON.parse(config.data) : undefined,
          description: config._offlineDescription || 'Queued action',
        });
        // Return a synthetic success so the UI doesn't break
        return {
          data: { _offline: true, message: 'Saved offline. Will sync when back online.' },
          status: 200,
          _queued: true,
        };
      }
    }

    return Promise.reject(error);
  }
);

export default api;
