import { create } from 'zustand';
import api from '../api/axios';
import { toast } from 'react-hot-toast';

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  loading: true,
  activeSessionId: null, // Add this to store the active session ID

  checkAuth: async () => {
    set({ loading: true });
    try {
      const { data } = await api.get('https://shreeyanshsingh-raghuvanshi-kairob.hf.space/api/auth/me');
      set({ user: data, isAuthenticated: true, loading: false });
    } catch (error) {
      console.error('Not authenticated:', error);
      set({ user: null, isAuthenticated: false, loading: false });
    }
  },

  logout: async () => {
    try {
      await api.post('https://shreeyanshsingh-raghuvanshi-kairob.hf.space/api/auth/logout');
      set({ user: null, isAuthenticated: false });
      toast.success('Logged out successfully!');
    } catch (error) {
      toast.error('Logout failed. Please try again.');
      console.error('Logout error:', error);
    }
  },

    // Add a function to set the active session ID
  setActiveSessionId: (sessionId) => set({ activeSessionId: sessionId }),
}));

export default useAuthStore;