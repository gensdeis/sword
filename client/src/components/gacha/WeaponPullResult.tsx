'use client';

import React from 'react';
import { Weapon } from '@/types';
import { getRarityColor, getRarityBgColor, getRarityLabel, calculateTotalAttack, formatNumber } from '@/lib/utils';
import Button from '@/components/common/Button';
import { cn } from '@/lib/utils';

interface WeaponPullResultProps {
  weapon: Weapon;
  rerollCount: number;
  rerollCost: number;
  onReroll: () => void;
  onKeep: () => void;
  isLoading: boolean;
  canReroll: boolean;
}

export default function WeaponPullResult({
  weapon,
  rerollCount,
  rerollCost,
  onReroll,
  onKeep,
  isLoading,
  canReroll,
}: WeaponPullResultProps) {
  const totalAttack = calculateTotalAttack(weapon.baseAttack, weapon.enhancementLevel);

  return (
    <div className="animate-fadeIn">
      {/* Result Card */}
      <div className={cn('mb-6 p-6 rounded-lg border-4', getRarityBgColor(weapon.rarity))}>
        <div className="flex items-center justify-center h-40 mb-4 bg-white rounded-lg">
          {weapon.imageUrl ? (
            <img src={weapon.imageUrl} alt={weapon.name} className="h-full object-contain" />
          ) : (
            <span className="text-8xl">⚔️</span>
          )}
        </div>

        <h3 className={cn('text-2xl font-bold mb-2', getRarityColor(weapon.rarity))}>
          {weapon.name}
          {weapon.enhancementLevel > 0 && (
            <span className="ml-1">+{weapon.enhancementLevel}</span>
          )}
        </h3>

        <div className="text-center space-y-1 text-gray-700">
          <p className="text-lg">등급: <span className={cn('font-bold', getRarityColor(weapon.rarity))}>{getRarityLabel(weapon.rarity)}</span></p>
          <p>기본 공격력: {weapon.baseAttack}</p>
          {weapon.enhancementLevel > 0 && (
            <p className="text-blue-600">강화 공격력: +{weapon.enhancementLevel * 10}</p>
          )}
          <p className="text-xl font-bold">총 공격력: {totalAttack}</p>
        </div>
      </div>

      {/* Reroll Info */}
      <div className="mb-6 text-gray-600">
        <p>리롤 횟수: {rerollCount}회</p>
        <p>다음 리롤 비용: {formatNumber(rerollCost)} 골드</p>
      </div>

      {/* Actions */}
      <div className="flex gap-4 justify-center">
        <Button
          variant="secondary"
          size="lg"
          onClick={onReroll}
          isLoading={isLoading}
          disabled={!canReroll}
        >
          리롤 ({formatNumber(rerollCost)} 골드)
        </Button>
        <Button
          variant="success"
          size="lg"
          onClick={onKeep}
          isLoading={isLoading}
        >
          획득
        </Button>
      </div>

      {!canReroll && (
        <p className="mt-4 text-red-600 text-sm">골드가 부족하여 리롤할 수 없습니다.</p>
      )}
    </div>
  );
}
