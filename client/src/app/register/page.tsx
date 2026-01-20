'use client';

import React from 'react';
import RegisterForm from '@/components/auth/RegisterForm';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center px-4">
      <div className="w-full">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-blue-600 mb-2">Sword Game</h1>
          <p className="text-gray-600">회원가입하고 게임을 시작하세요!</p>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
}
