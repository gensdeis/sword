import { create } from 'zustand';
import { User, LoginRequest, RegisterRequest, AuthResponse } from '@/types';
import api, { setAuthHeader } from '@/lib/api';
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
      console.log('Login API response:', response.data); // Added console log
      const { accessToken, user } = response.data;

      setToken(accessToken);
      setAuthHeader(accessToken); // Set header immediately
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
      setAuthHeader(accessToken); // Set header immediately
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
    setAuthHeader(null); // Remove header
    set({ user: null, isAuthenticated: false });
    toast.success('로그아웃되었습니다.');
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },

  checkAuth: async (): Promise<boolean> => {
    const token = getToken();
    console.log('checkAuth: Token found?', !!token);
    if (!token) {
      setAuthHeader(null); // Ensure header is cleared
      set({ user: null, isAuthenticated: false });
      console.log('checkAuth: No token, returning false.');
      return false;
    }

    // Set header for subsequent requests
    setAuthHeader(token);

    try {
      const response = await api.get<User>('/auth/profile');
      console.log('checkAuth: Profile API response:', response.data);
      set({ user: response.data, isAuthenticated: true });
      console.log('checkAuth: Auth successful, returning true.');
      return true;
    } catch (error) {
      console.error('checkAuth: Profile API failed:', error);
      removeToken();
      setAuthHeader(null); // Remove header on failure
      set({ user: null, isAuthenticated: false });
      console.log('checkAuth: Auth failed, returning false.');
      return false;
    }
  },
}));
