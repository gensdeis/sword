'use client';

import React, { useEffect } from 'react';
import { useUserStore } from '@/stores/userStore';
import { useGachaStore } from '@/stores/gachaStore';
import api from '@/lib/api';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import WeaponPullResult from './WeaponPullResult';
import toast from 'react-hot-toast';
import { formatNumber } from '@/lib/utils';

const PULL_COST = 1000;

export default function GachaMachine() {
  const { user, fetchProfile } = useUserStore();
  const { gachaSession, isLoading, getActiveSession, pull, reroll, keep } = useGachaStore();

  const gold = user?.gold ?? 0;

  useEffect(() => {
    // Fetch active session on mount
    getActiveSession();
    fetchProfile(); // Ensure user profile is up-to-date
  }, [getActiveSession, fetchProfile]);

  const handlePull = async () => {
    if (gold < PULL_COST) {
      toast.error('골드가 부족합니다!');
      return;
    }
    try {
      await pull();
    } catch (error) {
      // Error handled in store, no need to re-throw or toast here
    }
  };

  const handleReroll = async () => {
    if (!gachaSession) return;
    if (gold < gachaSession.rerollCost) {
      toast.error('골드가 부족합니다!');
      return;
    }
    try {
      await reroll();
    } catch (error) {
      // Error handled in store
    }
  };

  const handleKeep = async () => {
    if (!gachaSession) return;
    try {
      await keep();
    } catch (error) {
      // Error handled in store
    }
  };

  if (isLoading) {
    return <p>로딩 중...</p>; // Or a proper loading spinner
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-6">무기 뽑기</h2>

          {/* Current Gold */}
          <div className="mb-6">
            <div className="inline-flex items-center bg-yellow-50 border border-yellow-300 rounded-lg px-6 py-3">
              <span className="text-yellow-600 font-semibold mr-2 text-2xl">💰</span>
              <span className="text-gray-900 font-bold text-xl">{formatNumber(gold)}</span>
            </div>
          </div>

          {!gachaSession ? (
            <>
              {/* Pull Button */}
              <div className="mb-6">
                <div className="mb-4 text-gray-600">
                  <p className="text-lg">뽑기 비용: {formatNumber(PULL_COST)} 골드</p>
                </div>
                <Button
                  size="lg"
                  onClick={handlePull}
                  isLoading={isLoading}
                  disabled={gold < PULL_COST}
                  className="text-xl px-12 py-4"
                >
                  무기 뽑기
                </Button>
              </div>

              {/* Gacha Machine Animation */}
              <div className="mt-8 flex items-center justify-center h-64 bg-gradient-to-b from-blue-50 to-purple-50 rounded-lg border-4 border-blue-300">
                <div className="text-center">
                  <span className="text-8xl">🎰</span>
                  <p className="mt-4 text-gray-600 font-medium">행운을 시험해보세요!</p>
                </div>
              </div>
            </>
          ) : (
            <WeaponPullResult
              weapon={gachaSession.weapon}
              rerollCount={gachaSession.rerollCount}
              rerollCost={gachaSession.rerollCost}
              onReroll={handleReroll}
              onKeep={handleKeep}
              isLoading={isLoading}
              canReroll={gachaSession.canReroll && gold >= gachaSession.rerollCost}
            />
          )}
        </div>
      </Card>
    </div>
  );
}
