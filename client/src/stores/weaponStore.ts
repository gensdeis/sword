import { create } from 'zustand';
import { Weapon } from '@/types';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface WeaponState {
  weapons: Weapon[];
  selectedWeapon: Weapon | null;
  isLoading: boolean;
  fetchWeapons: () => Promise<void>;
  equipWeapon: (weaponId: number) => Promise<void>;
  sellWeapon: (weaponId: number) => Promise<void>;
  setSelectedWeapon: (weapon: Weapon | null) => void;
}

export const useWeaponStore = create<WeaponState>((set, get) => ({
  weapons: [],
  selectedWeapon: null,
  isLoading: false,

  fetchWeapons: async () => {
    try {
      set({ isLoading: true });
      const response = await api.get<Weapon[]>('/weapons/my');
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
      useUserStore.getState().fetchProfile();
    } catch (error) {
      console.error('Sell weapon failed:', error);
    }
  },

  setSelectedWeapon: (weapon: Weapon | null) => {
    set({ selectedWeapon: weapon });
  },
}));
