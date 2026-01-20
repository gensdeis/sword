'use client';

import React from 'react';
import Button from '@/components/common/Button';

interface SellButtonProps {
  weaponId: number;
  isEquipped: boolean;
  onSell: (weaponId: number) => void;
}

export default function SellButton({ weaponId, isEquipped, onSell }: SellButtonProps) {
  const handleSell = () => {
    if (window.confirm('정말로 이 무기를 판매하시겠습니까?')) {
      onSell(weaponId);
    }
  };

  return (
    <Button
      variant="danger"
      size="sm"
      onClick={handleSell}
      disabled={isEquipped}
    >
      판매하기
    </Button>
  );
}
