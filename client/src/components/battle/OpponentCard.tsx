'use client';

import React from 'react';
import { Opponent } from '@/types';
import { getRarityColor, getRarityLabel } from '@/lib/utils';
import Card from '@/components/common/Card';
import { cn } from '@/lib/utils';

interface OpponentCardProps {
  opponent: Opponent;
}

export default function OpponentCard({ opponent }: OpponentCardProps) {
  return (
    <Card className="bg-gradient-to-br from-red-50 to-orange-50">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">상대 정보</h3>

        <div className="flex items-center justify-center mb-4">
          <span className="text-6xl">🤺</span>
        </div>

        <div className="space-y-2 text-lg">
          <p>
            <span className="text-gray-600">이름:</span>{' '}
            <span className="font-bold text-gray-900">{opponent.username}</span>
          </p>
          <p>
            <span className="text-gray-600">무기 등급:</span>{' '}
            <span className={cn('font-bold', getRarityColor(opponent.weaponRarity))}>
              {getRarityLabel(opponent.weaponRarity)}
            </span>
          </p>
          <p>
            <span className="text-gray-600">무기 레벨:</span>{' '}
            <span className="font-bold text-gray-900">+{opponent.weaponLevel}</span>
          </p>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-300">
          <p className="text-sm text-gray-500">상대를 물리치고 보상을 획득하세요!</p>
        </div>
      </div>
    </Card>
  );
}
