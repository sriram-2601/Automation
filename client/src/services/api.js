import axios from 'axios';

let API_URL = '/api';

if (typeof window !== 'undefined') {
  if (process.env.NEXT_PUBLIC_API_URL) {
    API_URL = process.env.NEXT_PUBLIC_API_URL;
  } else {
    API_URL = '/api';
  }
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Bypass-Tunnel-Reminder': 'true',
    'serveo-skip-browser-warning': 'true'
  },
  timeout: 10000,
});

// Add a request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('agentflow_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle session expiration (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('agentflow_token');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
