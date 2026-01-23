'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { RankingEntry, SeasonInfo } from '@/types';
import api from '@/lib/api';
import Header from '@/components/layout/Header';
import Card from '@/components/common/Card';
import Loading from '@/components/common/Loading';
import { formatNumber } from '@/lib/utils';

interface SeasonResponse {
  id: number;
  seasonNumber: number;
  startAt: string;
  endAt: string;
  status: string;
  rewardWeaponTemplateId: number | null;
  isInSettlement: boolean;
}

interface RankingResponse {
  seasonId: number;
  rankings: Array<{
    rank: number;
    userId: number;
    username: string;
    totalPoints: number;
    winCount: number;
    loseCount: number;
    currentStreak: number;
    bestStreak: number;
    maxEnhancementLevel: number;
  }>;
  totalParticipants: number;
}

interface DisplayRankingEntry {
  rank: number;
  userId: number;
  username: string;
  totalPoints: number;
  winCount: number;
  loseCount: number;
  bestStreak: number;
  maxEnhancementLevel: number;
}

export default function RankingPage() {
  const router = useRouter();
  const { isAuthenticated, checkAuth, user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [rankingType, setRankingType] = useState<'points' | 'enhancement'>('points');
  const [rankings, setRankings] = useState<DisplayRankingEntry[]>([]);
  const [season, setSeason] = useState<SeasonInfo | null>(null);
  const [myRank, setMyRank] = useState<DisplayRankingEntry | null>(null);

  useEffect(() => {
    const init = async () => {
      await checkAuth();
      if (!isAuthenticated) {
        router.push('/login');
      } else {
        await fetchRankings(rankingType);
      }
      setIsLoading(false);
    };
    init();
  }, [rankingType]);

  const fetchRankings = async (type: 'points' | 'enhancement') => {
    try {
      const seasonRes = await api.get<SeasonResponse | null>('/seasons/current');

      const currentSeason = seasonRes.data;
      if (!currentSeason) {
        setSeason(null);
        setRankings([]);
        setMyRank(null);
        return;
      }

      setSeason({
        id: currentSeason.id,
        name: `시즌 ${currentSeason.seasonNumber}`,
        startDate: currentSeason.startAt,
        endDate: currentSeason.endAt,
        isActive: currentSeason.status === 'active',
      });

      const rankingsRes = await api.get<RankingResponse>(`/seasons/${currentSeason.id}/rankings?type=${type}`);

      const mappedRankings: DisplayRankingEntry[] = rankingsRes.data.rankings.map((r) => ({
        rank: r.rank,
        userId: r.userId,
        username: r.username,
        totalPoints: r.totalPoints,
        winCount: r.winCount,
        loseCount: r.loseCount,
        bestStreak: r.bestStreak,
        maxEnhancementLevel: r.maxEnhancementLevel,
      }));

      setRankings(mappedRankings);

      const myRanking = mappedRankings.find((r) => r.userId === user?.id);
      if (myRanking) {
        setMyRank(myRanking);
      }
    } catch (error) {
      console.error('Fetch rankings failed:', error);
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    return null;
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}위`;
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8">랭킹</h1>

          {/* Season Info */}
          {season && (
            <Card className="mb-8 bg-gradient-to-r from-purple-50 to-blue-50">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-purple-600 mb-2">{season.name}</h2>
                <p className="text-sm text-gray-600">
                  {new Date(season.startDate).toLocaleDateString('ko-KR')} ~{' '}
                  {new Date(season.endDate).toLocaleDateString('ko-KR')}
                </p>
                {season.isActive && (
                  <span className="inline-block mt-2 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    진행중
                  </span>
                )}
              </div>
            </Card>
          )}

          {/* My Rank */}
          {myRank && (
            <Card className="mb-8 bg-gradient-to-r from-yellow-50 to-orange-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">내 순위</h3>
                  <p className="text-sm text-gray-600">{user?.username}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-orange-600">{getRankIcon(myRank.rank)}</p>
                  <p className="text-sm text-gray-600">
                    {rankingType === 'points' ? (
                      <>포인트: {formatNumber(myRank.totalPoints)} | 연승: {formatNumber(myRank.bestStreak)}회</>
                    ) : (
                      <>최대 강화: +{myRank.maxEnhancementLevel} | 승리: {myRank.winCount}회</>
                    )}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Ranking Tabs */}
          <div className="flex mb-4 gap-2">
            <button
              onClick={() => setRankingType('points')}
              className={`flex-1 py-3 px-4 rounded-lg font-bold transition-all ${
                rankingType === 'points'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              전투 포인트 랭킹
            </button>
            <button
              onClick={() => setRankingType('enhancement')}
              className={`flex-1 py-3 px-4 rounded-lg font-bold transition-all ${
                rankingType === 'enhancement'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              최대 강화 단계 랭킹
            </button>
          </div>

          {/* Rankings Table */}
          <Card>
            <h2 className="text-2xl font-bold mb-6">Top 100</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4">순위</th>
                    <th className="text-left py-3 px-4">플레이어</th>
                    {rankingType === 'points' ? (
                      <>
                        <th className="text-right py-3 px-4">전투 포인트</th>
                        <th className="text-right py-3 px-4">최고 연승</th>
                      </>
                    ) : (
                      <>
                        <th className="text-right py-3 px-4">최대 강화 단계</th>
                        <th className="text-right py-3 px-4">총 승리</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {rankings.map((entry) => (
                    <tr
                      key={entry.userId}
                      className={`border-b border-gray-100 hover:bg-gray-50 ${
                        entry.userId === user?.id ? 'bg-yellow-50' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-bold">
                        {entry.rank <= 3 ? (
                          <span className="text-2xl">{getRankIcon(entry.rank)}</span>
                        ) : (
                          <span>{entry.rank}위</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {entry.username}
                        {entry.userId === user?.id && (
                          <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-0.5 rounded">
                            나
                          </span>
                        )}
                      </td>
                      {rankingType === 'points' ? (
                        <>
                          <td className="py-3 px-4 text-right font-medium text-blue-600">
                            {formatNumber(entry.totalPoints)}
                          </td>
                          <td className="py-3 px-4 text-right font-medium text-orange-600">
                            {formatNumber(entry.bestStreak)}회
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-3 px-4 text-right font-bold text-purple-600">
                            +{entry.maxEnhancementLevel}
                          </td>
                          <td className="py-3 px-4 text-right font-medium">
                            {formatNumber(entry.winCount)}회
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
