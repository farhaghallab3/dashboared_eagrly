import axios, { AxiosError, InternalAxiosRequestConfig, AxiosHeaders } from 'axios';
import { AuthResponse } from '../types';

// Using relative path to leverage Vite proxy
const BASE_URL = '/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request Interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token');

    // Do not attach token for auth endpoints to avoid issues with stale tokens or 401 loops
    // Also exclude if the request is specifically for refreshing token
    const isAuthEndpoint = config.url?.includes('/token/') || config.url === '/token/';

    if (token && !isAuthEndpoint) {
      if (config.headers) {
        // Handle both AxiosHeaders object and plain object
        if (config.headers instanceof AxiosHeaders) {
          config.headers.set('Authorization', `Bearer ${token}`);
        } else {
          (config.headers as any)['Authorization'] = `Bearer ${token}`;
        }
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor for Refresh Token
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If 401 and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');

      if (refreshToken) {
        try {
          const { data } = await axios.post<AuthResponse>(`${BASE_URL}/token/refresh/`, {
            refresh: refreshToken,
          });

          localStorage.setItem('access_token', data.access);

          // Update defaults
          api.defaults.headers.common['Authorization'] = `Bearer ${data.access}`;

          // Update original request
          if (originalRequest.headers) {
            if (originalRequest.headers instanceof AxiosHeaders) {
              originalRequest.headers.set('Authorization', `Bearer ${data.access}`);
            } else {
              (originalRequest.headers as any)['Authorization'] = `Bearer ${data.access}`;
            }
          }

          return api(originalRequest);
        } catch (refreshError) {
          // Logout if refresh fails
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.hash = '#/login';
          return Promise.reject(refreshError);
        }
      } else {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.hash = '#/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;