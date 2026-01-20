'use client';

import React from 'react';
import Button from '@/components/common/Button';
import { formatNumber } from '@/lib/utils';

interface RerollButtonProps {
  cost: number;
  canReroll: boolean;
  onReroll: () => void;
  isLoading?: boolean;
}

export default function RerollButton({ cost, canReroll, onReroll, isLoading = false }: RerollButtonProps) {
  return (
    <Button
      variant="secondary"
      onClick={onReroll}
      disabled={!canReroll}
      isLoading={isLoading}
    >
      리롤 ({formatNumber(cost)} 골드)
    </Button>
  );
}
