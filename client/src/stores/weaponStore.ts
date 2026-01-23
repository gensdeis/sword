import { create } from 'zustand';
import { Weapon } from '@/types';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { EnhanceResponseDto } from '@/types/api';

interface WeaponState {
  weapons: Weapon[];
  selectedWeapon: Weapon | null;
  isLoading: boolean;
  fetchWeapons: (token?: string) => Promise<void>;
  equipWeapon: (weaponId: number) => Promise<void>;
  sellWeapon: (weaponId: number) => Promise<void>;
  enhanceWeapon: (weaponId: number) => Promise<EnhanceResponseDto | undefined>;
  setSelectedWeapon: (weapon: Weapon | null) => void;
}

export const useWeaponStore = create<WeaponState>((set, get) => ({
  weapons: [],
  selectedWeapon: null,
  isLoading: false,

  fetchWeapons: async (token?: string) => {
    try {
      set({ isLoading: true });
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await api.get<Weapon[]>('/weapons/my', { headers });
      set({ weapons: response.data });
    } catch (error) {
      console.error('Fetch weapons failed:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  equipWeapon: async (weaponId: number) => {
    try {
      await api.post(`/weapons/${weaponId}/equip`);

      // Update local state
      set((state) => ({
        weapons: state.weapons.map((weapon) =>
          weapon.id === weaponId
            ? { ...weapon, isEquipped: true }
            : { ...weapon, isEquipped: false }
        ),
      }));

      toast.success('무기를 장착했습니다.');
    } catch (error) {
      console.error('Equip weapon failed:', error);
      toast.error('무기 장착에 실패했습니다.');
    }
  },

  sellWeapon: async (weaponId: number) => {
    try {
      const response = await api.delete<{ goldEarned: number }>(`/weapons/${weaponId}`);
      const { goldEarned } = response.data;

      // Remove weapon from local state
      set((state) => ({
        weapons: state.weapons.filter((weapon) => weapon.id !== weaponId),
      }));

      toast.success(`무기를 판매하여 ${goldEarned} 골드를 획득했습니다.`);

      // Refresh profile to update gold
      const { useUserStore } = await import('./userStore');
      await useUserStore.getState().fetchProfile();
    } catch (error) {
      console.error('Sell weapon failed:', error);
      toast.error('무기 판매에 실패했습니다.');
    }
  },

  enhanceWeapon: async (weaponId: number) => {
    try {
      const response = await api.post<EnhanceResponseDto>(`/weapons/${weaponId}/enhance`);
      const { weapon: updatedWeapon, result } = response.data;

      if (result === 'success' && updatedWeapon) {
        set((state) => ({
          weapons: state.weapons.map((w) => (w.id === weaponId ? updatedWeapon : w)),
        }));
        toast.success(`강화 성공! (+${updatedWeapon.enhancementLevel})`);
      } else if (result === 'maintain') {
        toast.error('강화에 실패했습니다.');
      } else if (result === 'destroyed') {
        toast.error('무기가 파괴되었습니다!', { icon: '💥' });
        // Remove weapon from local state
        set((state) => ({
          weapons: state.weapons.filter((weapon) => weapon.id !== weaponId),
        }));
      }

      // Refresh profile to update gold and stones
      const { useUserStore } = await import('./userStore');
      await useUserStore.getState().fetchProfile();
      
      return response.data;
    } catch (error: any) {
      console.error('Enhance weapon failed:', error);
      const message = error.response?.data?.message || '강화에 실패했습니다.';
      toast.error(message);
      return undefined;
    }
  },

  setSelectedWeapon: (weapon: Weapon | null) => {
    set({ selectedWeapon: weapon });
  },
}));
