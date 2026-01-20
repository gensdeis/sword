'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';

export default function LoginForm() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(formData);
      router.push('/');
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <Card className="max-w-md mx-auto mt-10">
      <h2 className="text-2xl font-bold text-center mb-6">로그인</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            이메일
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="your@email.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            비밀번호
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="비밀번호를 입력하세요"
          />
        </div>

        <Button type="submit" className="w-full" isLoading={isLoading}>
          로그인
        </Button>
      </form>

      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">
          계정이 없으신가요?{' '}
          <Link href="/register" className="text-blue-600 hover:text-blue-700 font-medium">
            회원가입
          </Link>
        </p>
      </div>
    </Card>
  );
}
