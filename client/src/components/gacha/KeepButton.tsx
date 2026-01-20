'use client';

import React from 'react';
import Button from '@/components/common/Button';

interface KeepButtonProps {
  onKeep: () => void;
  isLoading?: boolean;
}

export default function KeepButton({ onKeep, isLoading = false }: KeepButtonProps) {
  return (
    <Button
      variant="success"
      onClick={onKeep}
      isLoading={isLoading}
    >
      획득하기
    </Button>
  );
}
