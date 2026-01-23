'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useUserStore } from '@/stores/userStore';
import Header from '@/components/layout/Header';
import Loading from '@/components/common/Loading';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { formatNumber } from '@/lib/utils';

interface PrayerPoolStats {
  positiveBuffs: number;
  negativeBuffs: number;
  neutrals: number;
  total: number;
  myTodayPrayerCount?: number;
}

export default function PrayerPage() {
  const router = useRouter();
  const { isAuthenticated, checkAuth } = useAuthStore();
  const { fetchProfile } = useUserStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isPraying, setIsPraying] = useState(false);
  const [stats, setStats] = useState<PrayerPoolStats | null>(null);

  const nextPrayerCost = ((stats?.myTodayPrayerCount ?? 0) + 1) * 500;

  useEffect(() => {
    const init = async () => {
      const isAuthed = await checkAuth();
      if (!isAuthed) {
        router.push('/login');
        return;
      }
      await Promise.all([
        fetchStats(),
        fetchProfile()
      ]);
      setIsLoading(false);
    };
    init();
  }, [checkAuth, router, fetchProfile]);

  const fetchStats = async () => {
    try {
      const response = await api.get<PrayerPoolStats>('/prayer/pool');
      setStats(response.data);
    } catch (error) {
      console.error('Fetch prayer stats failed:', error);
    }
  };

  const handlePray = async () => {
    setIsPraying(true);
    try {
      await api.post('/prayer/pray');
      toast.success('기도에 성공했습니다. 결과를 확인하세요...');
      await Promise.all([
        fetchStats(),
        fetchProfile()
      ]);
    } catch (error: any) {
      console.error('Prayer failed:', error);
      const message = error.response?.data?.message || '기도에 실패했습니다.';
      toast.error(message);
    } finally {
      setIsPraying(false);
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center">기도 풀 현황</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <Card className="flex flex-col justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-4">현재 풀 현황</h2>
                <p className="text-gray-600 mb-6">
                  기도에 성공하면 기도 풀에 버프 확률이 반영됩니다.
                  강화 시도 중 버프의 종류와 효과가 결정됩니다.
                </p>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
                    <span className="font-medium text-green-700">긍정적 버프 (Positive)</span>
                    <span className="text-xl font-bold text-green-600">{stats?.positiveBuffs ?? 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-200">
                    <span className="font-medium text-red-700">부정적 버프 (Negative)</span>
                    <span className="text-xl font-bold text-red-600">{stats?.negativeBuffs ?? 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <span className="font-medium text-gray-700">중립 버프 (Neutral)</span>
                    <span className="text-xl font-bold text-gray-600">{stats?.neutrals ?? 0}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">총 누적 기도</span>
                  <span className="text-2xl font-extrabold text-blue-600">{stats?.total ?? 0}</span>
                </div>
              </div>
            </Card>

            <Card className="text-center flex flex-col items-center justify-center p-8">
              <span className="text-8xl mb-6">?</span>
              <h2 className="text-2xl font-bold mb-4">기도하기</h2>
              <p className="text-gray-600 mb-2">
                당신의 검을 위해 기도하세요.<br />
                기도를 통해 운명을 바꾸고 강화를 성공시킬 수 있습니다.
              </p>
              <div className="mb-6 p-3 bg-yellow-50 rounded-lg border border-yellow-200 w-full">
                <p className="text-sm text-yellow-800">
                  금일 기도 횟수: <span className="font-bold">{stats?.myTodayPrayerCount ?? 0}</span>회
                </p>
                <p className="text-lg font-bold text-yellow-600">
                  비용: {formatNumber(nextPrayerCost)} 골드
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  * 기도할 때마다 비용이 500골드씩 증가합니다.
                </p>
              </div>
              <Button
                size="lg"
                className="w-full py-4 text-xl"
                onClick={handlePray}
                isLoading={isPraying}
              >
                기도하기
              </Button>
            </Card>
          </div>

          <Card className="bg-blue-50 border-blue-200">
            <h3 className="text-lg font-bold text-blue-800 mb-2">🙏 기도의 효과</h3>
            <ul className="list-disc list-inside text-blue-700 space-y-1">
              <li><strong>긍정적 버프</strong>: 개당 <strong>강화 성공 확률이 1%p 증가</strong>합니다.</li>
              <li><strong>부정적 버프</strong>: 개당 <strong>무기 파괴 확률이 0.5%p 증가</strong>합니다.</li>
              <li><strong>중립 버프</strong>: 강화 확률에 영향을 주지 않습니다.</li>
              <li>모든 기도는 강화 시도 시 <strong>누적된 모든 효과가 한번에 적용</strong>되며, 결과와 상관없이 <strong>모든 기도 풀이 초기화</strong>됩니다.</li>
            </ul>
          </Card>
        </div>
      </main>
    </div>
  );
}