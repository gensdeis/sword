'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import Header from '@/components/layout/Header';
import WeaponList from '@/components/weapons/WeaponList';
import Loading from '@/components/common/Loading';

export default function WeaponsPage() {
  const router = useRouter();
  const { isAuthenticated, checkAuth } = useAuthStore();
  const [isLoading, setIsLoading] = React.useState(true);

  useEffect(() => {
    const init = async () => {
      await checkAuth();
      if (!isAuthenticated) {
        router.push('/login');
      }
      setIsLoading(false);
    };
    init();
  }, []);

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
        <h1 className="text-4xl font-bold text-center mb-8">내 무기</h1>
        <WeaponList />
      </main>
    </div>
  );
}
