'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { useUserStore } from '@/stores/userStore';
import Button from '@/components/common/Button';
import { formatNumber } from '@/lib/utils';

export default function Header() {
  const { user: authUser, logout } = useAuthStore();
  const { user, checkAttendance, fetchProfile } = useUserStore();

  useEffect(() => {
    if (authUser) {
      fetchProfile();
    }
  }, [authUser, fetchProfile]);

  const handleAttendance = async () => {
    await checkAttendance();
  };

  const hasCheckedInToday = () => {
    if (!user?.lastAttendanceDate) {
      return false;
    }
    try {
      // The server returns a Date object or an ISO string.
      // We need to compare only the date part in the local timezone.
      const lastCheck = new Date(user.lastAttendanceDate);
      const today = new Date();
      
      return (
        lastCheck.getFullYear() === today.getFullYear() &&
        lastCheck.getMonth() === today.getMonth() &&
        lastCheck.getDate() === today.getDate()
      );
    } catch (e) {
      console.error('Error parsing lastAttendanceDate:', e);
      return false;
    }
  };

  const isAttendanceChecked = hasCheckedInToday();

  return (
    <header className="bg-white shadow-md border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold text-blue-600">
            Sword Game
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/weapons" className="text-gray-700 hover:text-blue-600 transition-colors">
              내 무기
            </Link>
            <Link href="/enhancement" className="text-gray-700 hover:text-blue-600 transition-colors">
              강화
            </Link>
            <Link href="/prayer" className="text-gray-700 hover:text-blue-600 transition-colors">
              기도
            </Link>
            <Link href="/gacha" className="text-gray-700 hover:text-blue-600 transition-colors">
              뽑기
            </Link>
            <Link href="/battle" className="text-gray-700 hover:text-blue-600 transition-colors">
              전투
            </Link>
            <Link href="/ranking" className="text-gray-700 hover:text-blue-600 transition-colors">
              랭킹
            </Link>
            <Link href="/mail" className="text-gray-700 hover:text-blue-600 transition-colors">
              우편함
            </Link>
          </nav>

          {/* User Info & Actions */}
          <div className="flex items-center space-x-4">
            {authUser && user && (
              <>
                {/* Gold & Stones Display */}
                <div className="flex items-center space-x-3">
                  <div className="flex items-center bg-yellow-50 border border-yellow-300 rounded-lg px-3 py-1.5">
                    <span className="text-yellow-600 font-semibold mr-1">💰</span>
                    <span className="text-gray-900 font-medium">{formatNumber(user.gold)}</span>
                  </div>
                  <div className="flex items-center bg-blue-50 border border-blue-300 rounded-lg px-3 py-1.5">
                    <span className="text-blue-600 font-semibold mr-1">💎</span>
                    <span className="text-gray-900 font-medium">{formatNumber(user.enhancementStones)}</span>
                  </div>
                </div>

                {/* Attendance Button */}
                <Button size="sm" onClick={handleAttendance} disabled={isAttendanceChecked}>
                  {isAttendanceChecked ? '출석 완료' : '출석 체크'}
                </Button>

                {/* User Info */}
                <div className="text-sm text-gray-700">
                  <span className="font-medium">{user.username}</span>
                </div>

                {/* Logout Button */}
                <Button variant="secondary" size="sm" onClick={logout}>
                  로그아웃
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden mt-4 flex flex-wrap gap-3">
          <Link href="/weapons" className="text-sm text-gray-700 hover:text-blue-600 transition-colors">
            내 무기
          </Link>
          <Link href="/enhancement" className="text-sm text-gray-700 hover:text-blue-600 transition-colors">
            강화
          </Link>
          <Link href="/prayer" className="text-sm text-gray-700 hover:text-blue-600 transition-colors">
            기도
          </Link>
          <Link href="/gacha" className="text-sm text-gray-700 hover:text-blue-600 transition-colors">
            뽑기
          </Link>
          <Link href="/battle" className="text-sm text-gray-700 hover:text-blue-600 transition-colors">
            전투
          </Link>
          <Link href="/ranking" className="text-sm text-gray-700 hover:text-blue-600 transition-colors">
            랭킹
          </Link>
          <Link href="/mail" className="text-sm text-gray-700 hover:text-blue-600 transition-colors">
            우편함
          </Link>
        </nav>
      </div>
    </header>
  );
}
