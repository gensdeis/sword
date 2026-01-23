import { create } from 'zustand';
import { GachaSession } from '@/types';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useUserStore } from './userStore';

interface GachaState {
  gachaSession: GachaSession | null;
  isLoading: boolean;
  getActiveSession: () => Promise<void>;
  pull: () => Promise<void>;
  reroll: () => Promise<void>;
  keep: () => Promise<void>;
}

export const useGachaStore = create<GachaState>((set, get) => ({
  gachaSession: null,
  isLoading: false,

  getActiveSession: async () => {
    try {
      set({ isLoading: true });
      const response = await api.get<GachaSession | ''>('/gacha/session');
      if (response.data) {
        set({ gachaSession: response.data });
      } else {
        set({ gachaSession: null });
      }
    } catch (error) {
      console.error('Get active gacha session failed:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  pull: async () => {
    try {
      set({ isLoading: true });
      const response = await api.post<GachaSession>('/gacha/pull');
      set({ gachaSession: response.data });
      useUserStore.getState().fetchProfile();
    } catch (error: any) {
      const message = error.response?.data?.message || '무기 뽑기에 실패했습니다.';
      toast.error(message);
      console.error('Gacha pull failed:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  reroll: async () => {
    const sessionId = get().gachaSession?.sessionId;
    if (!sessionId) return;

    try {
      set({ isLoading: true });
      const response = await api.post<GachaSession>(`/gacha/reroll/${sessionId}`);
      set({ gachaSession: response.data });
      useUserStore.getState().fetchProfile();
    } catch (error: any) {
      const message = error.response?.data?.message || '다시 뽑기에 실패했습니다.';
      toast.error(message);
      console.error('Gacha reroll failed:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  keep: async () => {
    const sessionId = get().gachaSession?.sessionId;
    if (!sessionId) return;

    try {
      set({ isLoading: true });
      await api.post(`/gacha/keep/${sessionId}`);
      
      // Clear session first to prevent duplicate clicks
      set({ gachaSession: null });

      // Refresh data
      const { useUserStore } = await import('./userStore');
      const { useWeaponStore } = await import('./weaponStore');
      
      await Promise.all([
        useUserStore.getState().fetchProfile(),
        useWeaponStore.getState().fetchWeapons()
      ]);

      toast.success('무기를 획득했습니다!');
    } catch (error) {
      console.error('Gacha keep failed:', error);
      toast.error('무기 획득에 실패했습니다.');
    } finally {
      set({ isLoading: false });
    }
  },
}));
