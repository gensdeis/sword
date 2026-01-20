import { create } from 'zustand';
import { User } from '@/types';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface UserState {
  gold: number;
  stones: number;
  consecutiveAttendanceDays: number;
  lastAttendanceDate: string | null;
  isLoading: boolean;
  fetchProfile: () => Promise<void>;
  updateGold: (amount: number) => void;
  updateStones: (amount: number) => void;
  checkAttendance: () => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  gold: 0,
  stones: 0,
  consecutiveAttendanceDays: 0,
  lastAttendanceDate: null,
  isLoading: false,

  fetchProfile: async () => {
    try {
      set({ isLoading: true });
      const response = await api.get<User>('/auth/profile');
      const { gold, stones, consecutiveAttendanceDays, lastAttendanceDate } = response.data;
      set({
        gold,
        stones,
        consecutiveAttendanceDays,
        lastAttendanceDate: lastAttendanceDate || null,
      });
    } catch (error) {
      console.error('Fetch profile failed:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  updateGold: (amount: number) => {
    set((state) => ({ gold: state.gold + amount }));
  },

  updateStones: (amount: number) => {
    set((state) => ({ stones: state.stones + amount }));
  },

  checkAttendance: async () => {
    try {
      const response = await api.post<{
        goldReward: number;
        stoneReward: number;
        consecutiveDays: number;
        alreadyChecked: boolean;
      }>('/users/attendance');

      const { goldReward, stoneReward, consecutiveDays, alreadyChecked } = response.data;

      if (alreadyChecked) {
        toast.error('이미 출석 체크를 완료했습니다.');
      } else {
        set((state) => ({
          gold: state.gold + goldReward,
          stones: state.stones + stoneReward,
          consecutiveAttendanceDays: consecutiveDays,
          lastAttendanceDate: new Date().toISOString(),
        }));
        toast.success(`출석 체크 완료! 골드 ${goldReward}, 보석 ${stoneReward} 획득!`);
      }
    } catch (error) {
      console.error('Attendance check failed:', error);
    }
  },
}));
