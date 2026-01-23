'use client';

import React, { useState, useEffect } from 'react';
import { useUserStore } from '@/stores/userStore';
import { Opponent, BattleResult } from '@/types';
import api from '@/lib/api';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import OpponentCard from './OpponentCard';
import BattleResultModal from './BattleResult';
import toast from 'react-hot-toast';
import { formatNumber } from '@/lib/utils';

const ENTRY_FEE = 100;

export default function BattleArena() {
  const { user, fetchProfile } = useUserStore();
  const gold = user?.gold ?? 0;
  const [isLoading, setIsLoading] = useState(false);
  const [opponent, setOpponent] = useState<Opponent | null>(null);
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleEnterBattle = async () => {
    if (gold < ENTRY_FEE) {
      toast.error('골드가 부족합니다!');
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.post<Opponent>('/battles/enter');
      setOpponent(response.data);
      await fetchProfile();
      toast.success('매칭이 완료되었습니다!');
    } catch (error) {
      console.error('Enter battle failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBattle = async () => {
    if (!opponent) return;

    try {
      setIsLoading(true);
      const response = await api.post<BattleResult>('/battles/fight', {
        opponentId: opponent.userId,
      });
      setBattleResult(response.data);
      setShowResult(true);
      await fetchProfile();
    } catch (error) {
      console.error('Battle failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseResult = () => {
    setShowResult(false);
    setBattleResult(null);
    setOpponent(null);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <h2 className="text-3xl font-bold text-center mb-6">전투 아레나</h2>

        {/* Current Gold */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center bg-yellow-50 border border-yellow-300 rounded-lg px-6 py-3">
            <span className="text-yellow-600 font-semibold mr-2 text-2xl">💰</span>
            <span className="text-gray-900 font-bold text-xl">{formatNumber(gold)}</span>
          </div>
        </div>

        {!opponent ? (
          <div className="text-center">
            <div className="mb-6">
              <p className="text-lg text-gray-600 mb-2">입장료: {formatNumber(ENTRY_FEE)} 골드</p>
              <p className="text-sm text-gray-500">상대를 찾아 전투를 시작하세요!</p>
            </div>

            <Button
              size="lg"
              onClick={handleEnterBattle}
              isLoading={isLoading}
              disabled={gold < ENTRY_FEE}
              className="text-xl px-12 py-4"
            >
              전투 입장
            </Button>

            {/* Battle Arena Visual */}
            <div className="mt-8 flex items-center justify-center h-64 bg-gradient-to-b from-red-50 to-orange-50 rounded-lg border-4 border-red-300">
              <div className="text-center">
                <span className="text-8xl">⚔️</span>
                <p className="mt-4 text-gray-600 font-medium">전투를 준비하세요!</p>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <OpponentCard opponent={opponent} />

            <div className="mt-6 text-center">
              <Button
                size="lg"
                variant="danger"
                onClick={handleBattle}
                isLoading={isLoading}
                className="text-xl px-12 py-4"
              >
                전투 시작!
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Battle Result Modal */}
      {battleResult && (
        <BattleResultModal
          isOpen={showResult}
          result={battleResult}
          onClose={handleCloseResult}
        />
      )}
    </div>
  );
}
