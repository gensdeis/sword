import { create } from 'zustand';
import { User } from '@/types';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface UserState {
  user: User | null;
  isLoading: boolean;
  fetchProfile: (token?: string) => Promise<void>;
  checkAttendance: () => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  isLoading: false,

  fetchProfile: async (token?: string) => {
    try {
      set({ isLoading: true });
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await api.get<User>('/auth/profile', { headers });
      set({ user: response.data });
    } catch (error) {
      console.error('Fetch profile failed:', error);
      set({ user: null });
    } finally {
      set({ isLoading: false });
    }
  },

  checkAttendance: async () => {
    try {
      const response = await api.post<any>('/attendance/check'); // any for now

      const { gold, consecutiveDays, checkedAt } = response.data;

      // Manually update user state after attendance
      set((state) => {
        if (!state.user) return {};
        return {
          user: {
            ...state.user,
            gold: state.user.gold + gold,
            consecutiveAttendanceDays: consecutiveDays,
            lastAttendanceDate: checkedAt,
          },
        };
      });

      toast.success(`출석 체크 완료! 골드 ${gold} 획득!`);
    } catch (error: any) {
      const message = error.response?.data?.message || '이미 출석 체크를 완료했습니다.';
      toast.error(message);
      // Removed console.error to prevent duplicate toasts if there's another error boundary
    }
  },
}));
