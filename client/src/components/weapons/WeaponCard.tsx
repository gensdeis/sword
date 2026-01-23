'use client';

import React from 'react';
import { Weapon } from '@/types';
import { getRarityColor, getRarityBgColor, getRarityLabel, calculateTotalAttack } from '@/lib/utils';
import Card from '@/components/common/Card';
import { cn } from '@/lib/utils';

interface WeaponCardProps {
  weapon: Weapon;
  onEquip?: (weaponId: number) => void;
  onSell?: (weaponId: number) => void;
  showActions?: boolean;
}

export default function WeaponCard({ weapon, onEquip, onSell, showActions = true }: WeaponCardProps) {
  const totalAttack = calculateTotalAttack(weapon.baseAttack, weapon.enhancementLevel);

  return (
    <Card className={cn('relative', getRarityBgColor(weapon.rarity))}>
      {weapon.isEquipped && (
        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
          장착중
        </div>
      )}

      {/* Weapon Image */}
      <div className="flex items-center justify-center h-32 mb-4 bg-white rounded-lg">
        {weapon.imageUrl ? (
          <img src={weapon.imageUrl} alt={weapon.weaponName} className="h-full object-contain" />
        ) : (
          <span className="text-6xl">⚔️</span>
        )}
      </div>

      {/* Weapon Info */}
      <div className="space-y-2">
        <h3 className={cn('text-lg font-bold', getRarityColor(weapon.rarity))}>
          {weapon.weaponName}
          {weapon.enhancementLevel > 0 && (
            <span className="ml-1 text-sm">+{weapon.enhancementLevel}</span>
          )}
        </h3>

        <div className="text-sm text-gray-600">
          <p>등급: {getRarityLabel(weapon.rarity)}</p>
          <p>기본 공격력: {weapon.baseAttack}</p>
          {weapon.enhancementLevel > 0 && (
            <p className="text-blue-600 font-medium">강화 공격력: +{weapon.enhancementLevel * 10}</p>
          )}
          <p className="font-bold text-gray-900 mt-1">총 공격력: {totalAttack}</p>
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex gap-2 mt-4">
          {!weapon.isEquipped && onEquip && (
            <button
              onClick={() => onEquip(weapon.id)}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              장착
            </button>
          )}
          {onSell && (
            <button
              onClick={() => onSell(weapon.id)}
              className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              disabled={weapon.isEquipped}
            >
              판매
            </button>
          )}
        </div>
      )}
    </Card>
  );
}
