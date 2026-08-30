import axios from 'axios';

const productionBackendUrl = 'https://vercel.app';
const backendUrl = import.meta.env.VITE_SOCKET_URL || productionBackendUrl;
const apiBaseUrl = `${backendUrl.replace(/\/$/, '')}/api`;

export const apiConfigurationError = null;

const api = axios.create({
  baseURL: apiBaseUrl ? apiBaseUrl.replace(/\/$/, '') : undefined,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('supportDeskToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
