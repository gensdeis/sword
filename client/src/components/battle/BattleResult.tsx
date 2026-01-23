'use client';

import React from 'react';
import { BattleResult as BattleResultType } from '@/types';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import { formatNumber, getRarityLabel } from '@/lib/utils';

interface BattleResultModalProps {
  isOpen: boolean;
  result: BattleResultType;
  onClose: () => void;
}

export default function BattleResultModal({ isOpen, result, onClose }: BattleResultModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="전투 결과">
      <div className="text-center">
        {/* Victory/Defeat Icon */}
        <div className="mb-6">
          {result.victory ? (
            <div>
              <span className="text-8xl">🏆</span>
              <h3 className="text-3xl font-bold text-green-600 mt-2">승리!</h3>
            </div>
          ) : (
            <div>
              <span className="text-8xl">💀</span>
              <h3 className="text-3xl font-bold text-red-600 mt-2">패배...</h3>
            </div>
          )}
        </div>

        {/* Battle Details */}
        <div className="space-y-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-bold text-gray-900 mb-2">나</h4>
            <p className="text-sm text-gray-600">{result.attacker.username}</p>
            <p className="text-sm text-gray-600">
              무기: {result.attacker.weapon.weaponName} +{result.attacker.weapon.enhancementLevel}
            </p>
            <p className="text-lg font-bold text-blue-600 mt-1">
              전투력: {result.attacker.calculatedPower}
            </p>
          </div>

          <div className="text-2xl font-bold text-gray-400">VS</div>

          <div className="bg-red-50 rounded-lg p-4">
            <h4 className="font-bold text-gray-900 mb-2">상대</h4>
            <p className="text-sm text-gray-600">{result.defender.username}</p>
            <p className="text-sm text-gray-600">
              무기: {result.defender.weapon.weaponName} +{result.defender.weapon.enhancementLevel}
            </p>
            <p className="text-lg font-bold text-red-600 mt-1">
              전투력: {result.defender.calculatedPower}
            </p>
          </div>
        </div>

        {/* Rewards */}
        {result.victory && (
          <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-6">
            <h4 className="font-bold text-gray-900 mb-2">보상</h4>
            <p className="text-xl font-bold text-yellow-600">
              💰 {formatNumber(result.goldReward || 0)} 골드
            </p>
            <p className="text-sm text-gray-600 mt-1">
              연승 기록: {result.newStreak}회
            </p>
          </div>
        )}

        <Button onClick={onClose} size="lg" className="w-full">
          확인
        </Button>
      </div>
    </Modal>
  );
}
