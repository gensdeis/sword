'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useUserStore } from '@/stores/userStore';
import { useWeaponStore } from '@/stores/weaponStore';
import Header from '@/components/layout/Header';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Loading from '@/components/common/Loading';
import Link from 'next/link';
import { formatNumber } from '@/lib/utils';
import { getToken } from '@/lib/auth';

export default function HomePage() {
  const router = useRouter();
  const { user: authUser, checkAuth } = useAuthStore();
  const { user, fetchProfile } = useUserStore();
  const { weapons, fetchWeapons } = useWeaponStore();
  const [isLoading, setIsLoading] = React.useState(true);

  useEffect(() => {
    const init = async () => {
      // If already authenticated from a previous login, skip checkAuth and fetch data
      if (authUser) {
        const token = getToken();
        console.log('Token being sent to fetchProfile/fetchWeapons:', token);
        await Promise.all([
          fetchProfile(token || undefined),
          fetchWeapons(token || undefined),
        ]);
      } else {
        // Otherwise, check authentication (e.g., on fresh load/refresh)
        const isAuthed = await checkAuth();
        if (!isAuthed) {
          router.push('/login');
          return; // Ensure no further operations if not authenticated
        }
        await Promise.all([fetchProfile(), fetchWeapons()]);
      }
      setIsLoading(false);
    };
    init();
  }, [authUser, router, checkAuth, fetchProfile, fetchWeapons]); // Added dependencies to useEffect

  if (isLoading || !user) {
    return <Loading />;
  }

  if (!authUser) {
    return null;
  }
  const equippedWeapon = weapons.find((w) => w.isEquipped);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8">대시보드</h1>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <div className="text-center">
                <span className="text-4xl mb-2">💰</span>
                <h3 className="text-lg font-semibold text-gray-700">골드</h3>
                <p className="text-3xl font-bold text-yellow-600">{formatNumber(user.gold)}</p>
              </div>
            </Card>

            <Card>
              <div className="text-center">
                <span className="text-4xl mb-2">💎</span>
                <h3 className="text-lg font-semibold text-gray-700">보석</h3>
                <p className="text-3xl font-bold text-blue-600">{formatNumber(user.enhancementStones)}</p>
              </div>
            </Card>

            <Card>
              <div className="text-center">
                <span className="text-4xl mb-2">⚔️</span>
                <h3 className="text-lg font-semibold text-gray-700">보유 무기</h3>
                <p className="text-3xl font-bold text-purple-600">{weapons.length}</p>
              </div>
            </Card>
          </div>

          {/* Attendance Info */}
          <Card className="mb-8">
            <div className="text-center">
              <h3 className="text-xl font-bold mb-2">출석 체크</h3>
              <p className="text-gray-600">
                연속 출석: <span className="font-bold text-blue-600">{user.consecutiveAttendanceDays}일</span>
              </p>
              <p className="text-sm text-gray-500 mt-1">매일 출석하여 보상을 받으세요!</p>
            </div>
          </Card>

          {/* Current Weapon */}
          {equippedWeapon && (
            <Card className="mb-8">
              <h3 className="text-xl font-bold mb-4 text-center">현재 장착 무기</h3>
              <div className="text-center">
                <span className="text-6xl mb-2">⚔️</span>
                <p className="text-2xl font-bold text-blue-600">
                  {equippedWeapon.name} +{equippedWeapon.enhancementLevel}
                </p>
                <p className="text-gray-600">
                  공격력: {equippedWeapon.baseAttack + equippedWeapon.enhancementLevel * 10}
                </p>
              </div>
            </Card>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/gacha">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <div className="text-center">
                  <span className="text-5xl mb-2">🎰</span>
                  <h3 className="text-lg font-bold">뽑기</h3>
                  <p className="text-sm text-gray-600">새로운 무기 획득</p>
                </div>
              </Card>
            </Link>

            <Link href="/battle">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <div className="text-center">
                  <span className="text-5xl mb-2">⚔️</span>
                  <h3 className="text-lg font-bold">전투</h3>
                  <p className="text-sm text-gray-600">다른 유저와 대결</p>
                </div>
              </Card>
            </Link>

            <Link href="/weapons">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <div className="text-center">
                  <span className="text-5xl mb-2">🗡️</span>
                  <h3 className="text-lg font-bold">내 무기</h3>
                  <p className="text-sm text-gray-600">무기 관리</p>
                </div>
              </Card>
            </Link>

            <Link href="/mail">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <div className="text-center">
                  <span className="text-5xl mb-2">✉️</span>
                  <h3 className="text-lg font-bold">우편함</h3>
                  <p className="text-sm text-gray-600">보상 수령</p>
                </div>
              </Card>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
