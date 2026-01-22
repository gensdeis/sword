'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const menuItems = [
  { href: '/', label: '대시보드', icon: '🏠' },
  { href: '/weapons', label: '내 무기', icon: '⚔️' },
  { href: '/enhancement', label: '강화', icon: '🔨' },
  { href: '/gacha', label: '뽑기', icon: '🎰' },
  { href: '/battle', label: '전투', icon: '⚡' },
  { href: '/ranking', label: '랭킹', icon: '🏆' },
  { href: '/mail', label: '우편함', icon: '✉️' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="bg-white shadow-md border-r border-gray-200 w-64 min-h-screen p-4">
      <nav className="space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              )}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
