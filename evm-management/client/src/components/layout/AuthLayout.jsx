import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from '@/components/common/LanguageContext';

export default function AuthLayout() {
  const { isAuthenticated } = useAuthStore();
  const { t } = useTranslation();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 relative overflow-x-hidden overflow-y-auto font-sans select-none">
      {/* Decorative Background Elements Wrapper to prevent scrollbar overflow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-saffron-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-[120px]" />
      </div>
      
      {/* Flag accent lines at top */}
      <div className="absolute top-0 inset-x-0 h-1 flex">
        <div className="flex-1 bg-[#FF9933]" /> {/* Saffron */}
        <div className="flex-1 bg-white" />      {/* White */}
        <div className="flex-1 bg-[#128807]" /> {/* Green */}
      </div>

      <div className="w-full max-w-md relative z-10">
        <Outlet />
      </div>

      {/* Footer information */}
      <div className="mt-4 text-center text-xs text-slate-500 relative z-10 max-w-md">
        <p className="font-sans font-medium text-slate-500">{t('Madhya Pradesh State Election Commission — EVM Inventory Management System')}</p>
        <p className="mt-1 text-slate-400 font-sans">Access is monitored and audited. Authorized personnel only.</p>
      </div>
    </div>
  );
}
