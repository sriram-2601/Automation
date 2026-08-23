import { create } from 'zustand';
import api from '../services/api.js';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  isHydrated: false,

  // Initialize auth state from localStorage
  initAuth: async () => {
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('agentflow_token');
    if (!token) {
      set({ isHydrated: true });
      return;
    }

    set({ token, isLoading: true, error: null });
    try {
      const response = await api.get('/auth/me');
      set({
        user: response.data.user,
        isAuthenticated: true,
        isLoading: false,
        isHydrated: true,
      });
    } catch (err) {
      console.error('Failed to restore session:', err.message);
      localStorage.removeItem('agentflow_token');
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        isHydrated: true,
      });
    }
  },

  register: async (name, email, password, role = 'operator') => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/register', { name, email, password, role });
      const { token, user } = response.data;
      
      localStorage.setItem('agentflow_token', token);
      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
      return { success: true };
    } catch (err) {
      const errMsg = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Registration failed';
      set({ isLoading: false, error: errMsg });
      return { success: false, error: errMsg };
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;

      localStorage.setItem('agentflow_token', token);
      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
      return { success: true };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Invalid email or password';
      set({ isLoading: false, error: errMsg });
      return { success: false, error: errMsg };
    }
  },

  logout: () => {
    localStorage.removeItem('agentflow_token');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

  clearError: () => set({ error: null }),
}));
