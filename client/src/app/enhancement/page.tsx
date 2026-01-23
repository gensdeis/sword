'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import Header from '@/components/layout/Header';
import Loading from '@/components/common/Loading';
import EnhancementUI from '@/components/enhancement/EnhancementUI';

export default function EnhancementPage() {
  const router = useRouter();
  const { isAuthenticated, checkAuth } = useAuthStore();
  const [isLoading, setIsLoading] = React.useState(true);

  useEffect(() => {
    const init = async () => {
      const isAuthed = await checkAuth();
      if (!isAuthed) {
        router.push('/login');
        return;
      }
      setIsLoading(false);
    };
    init();
  }, [checkAuth, router]);

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
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center">무기 강화</h1>
          <EnhancementUI />
        </div>
      </main>
    </div>
  );
}

