import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_URL;
export const apiConfigurationError = apiBaseUrl
  ? null
  : 'Missing VITE_API_URL. Add it in the Vercel project environment variables and redeploy.';

const api = axios.create({
  baseURL: apiBaseUrl ? apiBaseUrl.replace(/\/$/, '') : undefined,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (apiConfigurationError) {
    return Promise.reject(new Error(apiConfigurationError));
  }
  const token = localStorage.getItem('supportDeskToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
