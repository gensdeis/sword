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
          {result.isWin ? (
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
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-bold text-gray-900 mb-2">전투 정보</h4>
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>상대: {result.opponentName} (+{result.opponentLevel})</span>
              <span>승률: {result.winRate}%</span>
            </div>
          </div>
        </div>

        {/* Rewards & Stats */}
        <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-6">
          <h4 className="font-bold text-gray-900 mb-2">보상 및 통계</h4>
          <div className="space-y-2">
            <p className="text-xl font-bold text-yellow-600">
              💰 {formatNumber(result.goldEarned || 0)} 골드
            </p>
            {result.pointsEarned > 0 && (
              <p className="text-lg font-bold text-blue-600">
                ⭐ {formatNumber(result.pointsEarned)} 포인트 획득
              </p>
            )}
            <div className="pt-2 border-t border-yellow-200 mt-2 text-sm text-gray-600 grid grid-cols-2 gap-2">
              <p>연승 기록: {result.currentStreak}회</p>
              <p>현재 순위: {result.ranking}위</p>
              <p className="col-span-2">총 시즌 포인트: {formatNumber(result.totalPoints)}</p>
            </div>
          </div>
        </div>

        <Button onClick={onClose} size="lg" className="w-full">
          확인
        </Button>
      </div>
    </Modal>
  );
}
