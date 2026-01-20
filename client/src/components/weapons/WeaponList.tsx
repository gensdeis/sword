'use client';

import React, { useEffect, useState } from 'react';
import { useWeaponStore } from '@/stores/weaponStore';
import { WeaponRarity } from '@/types';
import WeaponCard from './WeaponCard';
import Loading from '@/components/common/Loading';

export default function WeaponList() {
  const { weapons, isLoading, fetchWeapons, equipWeapon, sellWeapon } = useWeaponStore();
  const [filterRarity, setFilterRarity] = useState<WeaponRarity | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<'level' | 'rarity'>('level');

  useEffect(() => {
    fetchWeapons();
  }, [fetchWeapons]);

  const handleEquip = async (weaponId: number) => {
    await equipWeapon(weaponId);
  };

  const handleSell = async (weaponId: number) => {
    if (window.confirm('정말로 이 무기를 판매하시겠습니까?')) {
      await sellWeapon(weaponId);
    }
  };

  // Filter weapons
  let filteredWeapons = weapons;
  if (filterRarity !== 'ALL') {
    filteredWeapons = weapons.filter((w) => w.rarity === filterRarity);
  }

  // Sort weapons
  if (sortBy === 'level') {
    filteredWeapons = [...filteredWeapons].sort((a, b) => b.enhancementLevel - a.enhancementLevel);
  } else if (sortBy === 'rarity') {
    const rarityOrder = { LEGENDARY: 4, EPIC: 3, RARE: 2, COMMON: 1 };
    filteredWeapons = [...filteredWeapons].sort(
      (a, b) => rarityOrder[b.rarity] - rarityOrder[a.rarity]
    );
  }

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div>
      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">등급 필터</label>
          <select
            value={filterRarity}
            onChange={(e) => setFilterRarity(e.target.value as WeaponRarity | 'ALL')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">전체</option>
            <option value={WeaponRarity.COMMON}>일반</option>
            <option value={WeaponRarity.RARE}>레어</option>
            <option value={WeaponRarity.EPIC}>에픽</option>
            <option value={WeaponRarity.LEGENDARY}>전설</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">정렬</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'level' | 'rarity')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="level">강화 레벨순</option>
            <option value="rarity">등급순</option>
          </select>
        </div>
      </div>

      {/* Weapon Grid */}
      {filteredWeapons.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">보유한 무기가 없습니다.</p>
          <p className="text-gray-400 text-sm mt-2">뽑기를 통해 무기를 획득해보세요!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredWeapons.map((weapon) => (
            <WeaponCard
              key={weapon.id}
              weapon={weapon}
              onEquip={handleEquip}
              onSell={handleSell}
            />
          ))}
        </div>
      )}
    </div>
  );
}
