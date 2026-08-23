import { create } from 'zustand';
import api from '../services/api.js';

export const useWorkflowStore = create((set, get) => ({
  workflows: [],
  total: 0,
  page: 1,
  pages: 1,
  currentWorkflow: null,
  isLoading: false,
  error: null,
  dashboardStats: null,

  fetchDashboardStats: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/workflows/dashboard');
      set({ dashboardStats: response.data, isLoading: false });
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to fetch dashboard metrics', isLoading: false });
    }
  },

  fetchWorkflows: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/workflows', { params });
      set({
        workflows: response.data.workflows,
        total: response.data.total,
        page: response.data.page,
        pages: response.data.pages,
        isLoading: false,
      });
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to fetch workflows', isLoading: false });
    }
  },

  fetchWorkflowById: async (id) => {
    set({ isLoading: true, error: null, currentWorkflow: null });
    try {
      const response = await api.get(`/workflows/${id}`);
      set({ currentWorkflow: response.data, isLoading: false });
      return response.data;
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to fetch workflow details', isLoading: false });
      return null;
    }
  },

  createWorkflow: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/workflows', data);
      set((state) => ({
        workflows: [response.data, ...state.workflows],
        isLoading: false,
      }));
      return response.data;
    } catch (err) {
      const errMsg = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed to create workflow';
      set({ error: errMsg, isLoading: false });
      return null;
    }
  },

  updateWorkflow: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put(`/workflows/${id}`, data);
      set((state) => ({
        workflows: state.workflows.map((w) => (w._id === id ? response.data : w)),
        currentWorkflow: state.currentWorkflow?._id === id ? response.data : state.currentWorkflow,
        isLoading: false,
      }));
      return response.data;
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to update workflow', isLoading: false });
      return null;
    }
  },

  duplicateWorkflow: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post(`/workflows/${id}/duplicate`);
      set((state) => ({
        workflows: [response.data, ...state.workflows],
        isLoading: false,
      }));
      return response.data;
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to duplicate workflow', isLoading: false });
      return null;
    }
  },

  deleteWorkflow: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/workflows/${id}`);
      set((state) => ({
        workflows: state.workflows.filter((w) => w._id !== id),
        currentWorkflow: state.currentWorkflow?._id === id ? null : state.currentWorkflow,
        isLoading: false,
      }));
      return true;
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to delete workflow', isLoading: false });
      return false;
    }
  },

  executeWorkflow: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post(`/workflows/${id}/execute`);
      set({ isLoading: false });
      return response.data;
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to execute workflow', isLoading: false });
      return null;
    }
  },

  clearError: () => set({ error: null }),
}));
