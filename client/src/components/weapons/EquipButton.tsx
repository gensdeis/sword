'use client';

import React from 'react';
import Button from '@/components/common/Button';

interface EquipButtonProps {
  weaponId: number;
  isEquipped: boolean;
  onEquip: (weaponId: number) => void;
}

export default function EquipButton({ weaponId, isEquipped, onEquip }: EquipButtonProps) {
  if (isEquipped) {
    return (
      <div className="text-sm text-green-600 font-medium">현재 장착중</div>
    );
  }

  return (
    <Button size="sm" onClick={() => onEquip(weaponId)}>
      장착하기
    </Button>
  );
}
