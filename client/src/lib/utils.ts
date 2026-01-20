import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { WeaponRarity } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('ko-KR').format(num);
}

export function getRarityColor(rarity: WeaponRarity): string {
  switch (rarity) {
    case WeaponRarity.COMMON:
      return 'text-gray-500';
    case WeaponRarity.RARE:
      return 'text-blue-500';
    case WeaponRarity.EPIC:
      return 'text-purple-500';
    case WeaponRarity.LEGENDARY:
      return 'text-orange-500';
    default:
      return 'text-gray-500';
  }
}

export function getRarityBgColor(rarity: WeaponRarity): string {
  switch (rarity) {
    case WeaponRarity.COMMON:
      return 'bg-gray-100 border-gray-300';
    case WeaponRarity.RARE:
      return 'bg-blue-50 border-blue-300';
    case WeaponRarity.EPIC:
      return 'bg-purple-50 border-purple-300';
    case WeaponRarity.LEGENDARY:
      return 'bg-orange-50 border-orange-300';
    default:
      return 'bg-gray-100 border-gray-300';
  }
}

export function getRarityLabel(rarity: WeaponRarity): string {
  switch (rarity) {
    case WeaponRarity.COMMON:
      return '일반';
    case WeaponRarity.RARE:
      return '레어';
    case WeaponRarity.EPIC:
      return '에픽';
    case WeaponRarity.LEGENDARY:
      return '전설';
    default:
      return '일반';
  }
}

export function calculateTotalAttack(baseAttack: number, enhancementLevel: number): number {
  return baseAttack + enhancementLevel * 10;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
