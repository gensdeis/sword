'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useUserStore } from '@/stores/userStore';
import { Mail } from '@/types';
import api from '@/lib/api';
import Header from '@/components/layout/Header';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Loading from '@/components/common/Loading';
import { formatNumber, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function MailPage() {
  const router = useRouter();
  const { isAuthenticated, checkAuth } = useAuthStore();
  const { fetchProfile } = useUserStore();
  const [isLoading, setIsLoading] = useState(true);
  const [mails, setMails] = useState<Mail[]>([]);

  useEffect(() => {
    const init = async () => {
      await checkAuth();
      if (!isAuthenticated) {
        router.push('/login');
      } else {
        await fetchMails();
      }
      setIsLoading(false);
    };
    init();
  }, []);

  const fetchMails = async () => {
    try {
      const response = await api.get<Mail[]>('/mails');
      setMails(response.data);
    } catch (error) {
      console.error('Fetch mails failed:', error);
    }
  };

  const handleClaim = async (mailId: number) => {
    try {
      await api.post(`/mails/${mailId}/claim`);
      toast.success('보상을 받았습니다!');
      await fetchMails();
      await fetchProfile();
    } catch (error) {
      console.error('Claim mail failed:', error);
    }
  };

  const handleDelete = async (mailId: number) => {
    if (!window.confirm('정말로 이 우편을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await api.delete(`/mails/${mailId}`);
      toast.success('우편을 삭제했습니다.');
      await fetchMails();
    } catch (error) {
      console.error('Delete mail failed:', error);
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    return null;
  }

  const unreadCount = mails.filter((m) => !m.isRead).length;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold">우편함</h1>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                {unreadCount}개의 새 메일
              </span>
            )}
          </div>

          {mails.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <span className="text-6xl mb-4">📭</span>
                <p className="text-gray-500 text-lg">받은 우편이 없습니다.</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {mails.map((mail) => (
                <Card
                  key={mail.id}
                  className={`${!mail.isRead ? 'border-blue-500 border-2' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{mail.title}</h3>
                        {!mail.isRead && (
                          <span className="bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded">
                            NEW
                          </span>
                        )}
                      </div>
                      <p className="text-gray-700 mb-3 whitespace-pre-wrap">{mail.content}</p>

                      {/* Rewards */}
                      {(mail.rewardGold || mail.rewardStones) && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                          <p className="text-sm font-semibold text-gray-700 mb-1">보상:</p>
                          <div className="flex gap-4">
                            {mail.rewardGold && (
                              <div className="flex items-center">
                                <span className="text-yellow-600 mr-1">💰</span>
                                <span className="font-medium">
                                  {formatNumber(mail.rewardGold)} 골드
                                </span>
                              </div>
                            )}
                            {mail.rewardStones && (
                              <div className="flex items-center">
                                <span className="text-blue-600 mr-1">💎</span>
                                <span className="font-medium">
                                  {formatNumber(mail.rewardStones)} 보석
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="text-xs text-gray-500">
                        {formatDate(mail.createdAt)}
                        {mail.expiresAt && (
                          <span className="ml-2 text-red-500">
                            만료: {formatDate(mail.expiresAt)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="ml-4 flex flex-col gap-2">
                      {!mail.isClaimed && (mail.rewardGold || mail.rewardStones) && (
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => handleClaim(mail.id)}
                        >
                          받기
                        </Button>
                      )}
                      {mail.isClaimed && (
                        <span className="text-sm text-green-600 font-medium">수령 완료</span>
                      )}
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDelete(mail.id)}
                      >
                        삭제
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
