import { create } from 'zustand';
import { User, LoginRequest, RegisterRequest, AuthResponse } from '@/types';
import api from '@/lib/api';
import { setToken, removeToken, getToken } from '@/lib/auth';
import toast from 'react-hot-toast';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  login: async (data: LoginRequest) => {
    try {
      set({ isLoading: true });
      const response = await api.post<AuthResponse>('/auth/login', data);
      const { accessToken, user } = response.data;

      setToken(accessToken);
      set({ user, isAuthenticated: true });
      toast.success(`환영합니다, ${user.username}님!`);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (data: RegisterRequest) => {
    try {
      set({ isLoading: true });
      const response = await api.post<AuthResponse>('/auth/register', data);
      const { accessToken, user } = response.data;

      setToken(accessToken);
      set({ user, isAuthenticated: true });
      toast.success('회원가입이 완료되었습니다!');
    } catch (error) {
      console.error('Register failed:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: () => {
    removeToken();
    set({ user: null, isAuthenticated: false });
    toast.success('로그아웃되었습니다.');
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },

  checkAuth: async (): Promise<boolean> => {
    const token = getToken();
    if (!token) {
      set({ user: null, isAuthenticated: false });
      return false;
    }

    try {
      const response = await api.get<User>('/auth/profile');
      set({ user: response.data, isAuthenticated: true });
      return true;
    } catch (error) {
      console.error('Check auth failed:', error);
      removeToken();
      set({ user: null, isAuthenticated: false });
      return false;
    }
  },
}));
