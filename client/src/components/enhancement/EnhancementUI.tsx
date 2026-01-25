'use client';

import React, { useEffect, useState } from 'react';
import { useWeaponStore } from '@/stores/weaponStore';
import { useUserStore } from '@/stores/userStore';
import WeaponCard from '@/components/weapons/WeaponCard';
import Loading from '@/components/common/Loading';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import { Weapon } from '@/types';

const EnhancementUI = () => {
  const { weapons, isLoading, fetchWeapons, enhanceWeapon } = useWeaponStore();
  const { user, fetchProfile } = useUserStore();
  const [selectedWeapon, setSelectedWeapon] = useState<Weapon | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);

  const getEnhancementCost = (level: number) => {
    if (level < 10) {
      return {
        type: 'gold',
        amount: 100 + level * 50,
        label: '골드',
        icon: '💰'
      };
    } else {
      return {
        type: 'stones',
        amount: 1 + (level - 10),
        label: '보석',
        icon: '💎'
      };
    }
  };

  useEffect(() => {
    fetchWeapons();
    fetchProfile(); // To get updated gold and stones
  }, [fetchWeapons, fetchProfile]);

  const handleWeaponSelect = (weapon: Weapon) => {
    setSelectedWeapon(weapon);
  };

  const handleEnhance = async () => {
    if (!selectedWeapon) return;

    setIsEnhancing(true);
    try {
      const result = await enhanceWeapon(selectedWeapon.id);
      
      if (result && result.result !== 'destroyed' && result.weapon) {
        setSelectedWeapon(result.weapon);
      } else {
        setSelectedWeapon(null);
      }
    } finally {
      setIsEnhancing(false);
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="lg:w-2/3">
        <h2 className="text-xl font-semibold mb-4">내 무기</h2>
        {weapons.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">보유한 무기가 없습니다.</p>
            <p className="text-gray-400 text-sm mt-2">뽑기를 통해 무기를 획득해보세요!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {weapons.filter(w => w !== null).map((weapon) => (
              <div
                key={weapon.id}
                className={`cursor-pointer rounded-lg border-2 ${
                  selectedWeapon?.id === weapon.id ? 'border-blue-500' : 'border-transparent'
                }`}
                onClick={() => handleWeaponSelect(weapon)}
              >
                <WeaponCard weapon={weapon} showActions={false} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="lg:w-1/3">
        <h2 className="text-xl font-semibold mb-4">강화 정보</h2>
        <Card>
          {selectedWeapon ? (
            <div>
              <h3 className="text-lg font-bold mb-2">{selectedWeapon.weaponName}</h3>
              <p>등급: {selectedWeapon.rarity}</p>
              <p>현재 레벨: +{selectedWeapon.enhancementLevel}</p>
              <p>공격력: {selectedWeapon.baseAttack} (+{selectedWeapon.currentAttack - selectedWeapon.baseAttack})</p>
              <p className="mt-4 text-sm text-gray-600">
                강화 시도 시 일정 확률로 강화 레벨이 상승하거나, 실패할 경우 레벨이 하락하거나 무기가 파괴될 수 있습니다.
              </p>
              <div className="mt-6">
                <p className="text-sm font-medium">보유 강화석: {user?.enhancementStones ?? 0}</p>
                <p className="text-sm font-medium">보유 골드: {user?.gold ?? 0}</p>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm font-bold text-gray-700">소모 비용:</p>
                  <p className={`text-lg font-bold ${
                    selectedWeapon.enhancementLevel < 10 ? 'text-yellow-600' : 'text-blue-600'
                  }`}>
                    {getEnhancementCost(selectedWeapon.enhancementLevel).icon}{' '}
                    {getEnhancementCost(selectedWeapon.enhancementLevel).amount}{' '}
                    {getEnhancementCost(selectedWeapon.enhancementLevel).label}
                  </p>
                </div>
              </div>
              <Button
                onClick={handleEnhance}
                disabled={isEnhancing || !selectedWeapon}
                className="mt-4 w-full"
                variant={selectedWeapon.enhancementLevel < 10 ? 'primary' : 'danger'}
              >
                {isEnhancing ? '강화 중...' : `강화 시도 (+${selectedWeapon.enhancementLevel + 1})`}
              </Button>
            </div>
          ) : (
            <p className="text-gray-500">강화할 무기를 선택해주세요.</p>
          )}
        </Card>
      </div>
    </div>
  );
};

export default EnhancementUI;