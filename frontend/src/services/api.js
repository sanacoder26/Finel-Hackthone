import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_URL;

if (!apiBaseUrl) {
  throw new Error('Missing VITE_API_URL environment variable');
}

const api = axios.create({
  baseURL: apiBaseUrl.replace(/\/$/, ''),
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
