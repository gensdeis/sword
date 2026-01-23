'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import Header from '@/components/layout/Header';
import Loading from '@/components/common/Loading';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface PrayerPoolStats {
  positiveBuffs: number;
  negativeBuffs: number;
  neutrals: number;
  total: number;
}

export default function PrayerPage() {
  const router = useRouter();
  const { isAuthenticated, checkAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isPraying, setIsPraying] = useState(false);
  const [stats, setStats] = useState<PrayerPoolStats | null>(null);

  useEffect(() => {
    const init = async () => {
      const isAuthed = await checkAuth();
      if (!isAuthed) {
        router.push('/login');
        return;
      }
      await fetchStats();
      setIsLoading(false);
    };
    init();
  }, [checkAuth, router]);

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
      toast.success('기도를 올렸습니다. 기운이 세상에 퍼집니다...');
      await fetchStats();
    } catch (error) {
      console.error('Prayer failed:', error);
      toast.error('기도를 올리는 데 실패했습니다.');
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
          <h1 className="text-4xl font-bold mb-8 text-center">기도의 제단</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <Card className="flex flex-col justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-4">현재 세상의 기운</h2>
                <p className="text-gray-600 mb-6">
                  유저들이 올린 기도가 쌓여 전역 강화 확률에 영향을 줍니다.
                  강화 시도 시 풀에서 무작위 기운이 하나 소모됩니다.
                </p>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
                    <span className="font-medium text-green-700">축복의 기운 (Positive)</span>
                    <span className="text-xl font-bold text-green-600">{stats?.positiveBuffs ?? 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-200">
                    <span className="font-medium text-red-700">재앙의 기운 (Negative)</span>
                    <span className="text-xl font-bold text-red-600">{stats?.negativeBuffs ?? 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <span className="font-medium text-gray-700">평온한 기운 (Neutral)</span>
                    <span className="text-xl font-bold text-gray-600">{stats?.neutrals ?? 0}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">총 쌓인 기도</span>
                  <span className="text-2xl font-extrabold text-blue-600">{stats?.total ?? 0}</span>
                </div>
              </div>
            </Card>

            <Card className="text-center flex flex-col items-center justify-center p-8">
              <span className="text-8xl mb-6">?</span>
              <h2 className="text-2xl font-bold mb-4">기도 올리기</h2>
              <p className="text-gray-600 mb-8">
                간절한 마음으로 기도를 올려보세요.<br />
                세상의 기운을 바꾸고 강화를 도울 수 있습니다.
              </p>
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
            <h3 className="text-lg font-bold text-blue-800 mb-2">? 기도의 효과</h3>
            <ul className="list-disc list-inside text-blue-700 space-y-1">
              <li><strong>축복의 기운</strong>: 강화 성공 확률이 증가하고 파괴 확률이 감소합니다.</li>
              <li><strong>재앙의 기운</strong>: 강화 성공 확률이 감소하고 파괴 확률이 증가합니다.</li>
              <li><strong>평온한 기운</strong>: 강화 확률에 영향을 주지 않습니다.</li>
              <li>모든 기운은 강화 시도 시 전역 풀에서 무작위로 하나가 소모됩니다.</li>
            </ul>
          </Card>
        </div>
      </main>
    </div>
  );
}
