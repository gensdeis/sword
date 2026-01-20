'use client';

import React from 'react';
import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center px-4">
      <div className="w-full">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-blue-600 mb-2">Sword Game</h1>
          <p className="text-gray-600">칼을 키우고 최강의 전사가 되어보세요!</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
