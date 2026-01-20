'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import Header from '@/components/layout/Header';
import GachaMachine from '@/components/gacha/GachaMachine';
import Loading from '@/components/common/Loading';

export default function GachaPage() {
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
        <GachaMachine />
      </main>
    </div>
  );
}
