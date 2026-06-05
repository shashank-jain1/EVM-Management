import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import Button from '@/components/common/Button';
import { HelpCircle, ArrowLeft, Home } from 'lucide-react';
import { useTranslation } from '@/components/common/LanguageContext';

export default function NotFoundPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 relative overflow-hidden select-none">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-saffron-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
      
      {/* Flag accent lines at top */}
      <div className="absolute top-0 inset-x-0 h-1 flex">
        <div className="flex-1 bg-[#FF9933]" />
        <div className="flex-1 bg-white" />
        <div className="flex-1 bg-[#128807]" />
      </div>

      <div className="w-full max-w-md text-center bg-white border border-gray-250 shadow-2xl rounded-lg p-8 relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1 flex">
          <div className="flex-1 bg-[#FF9933]" />
          <div className="flex-1 bg-white border-y" />
          <div className="flex-1 bg-[#128807]" />
        </div>

        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-navy-50 text-navy-800 mb-5 border shadow-inner">
          <HelpCircle size={36} className="stroke-[1.2]" />
        </div>

        <h2 className="text-3xl font-black text-navy-900 font-mono tracking-tight leading-none">
          404
        </h2>
        <h3 className="text-sm font-bold text-gray-800 font-sans mt-2.5">
          {t('Resource Entry Not Found')}
        </h3>
        <p className="text-xs text-gray-500 font-sans mt-2 max-w-xs mx-auto leading-normal">
          {t('The directory path or registry segment you requested does not exist or has been archived.')}
        </p>

        <div className="mt-8 flex flex-col gap-2">
          {isAuthenticated ? (
            <Button
              onClick={() => navigate('/dashboard')}
              variant="primary"
              className="w-full text-xs font-bold cursor-pointer"
            >
              <span className="flex items-center justify-center gap-1.5">
                <Home size={14} /> {t('Return to Dashboard')}
              </span>
            </Button>
          ) : (
            <Button
              onClick={() => navigate('/login')}
              variant="primary"
              className="w-full text-xs font-bold cursor-pointer"
            >
              <span className="flex items-center justify-center gap-1.5">
                <ArrowLeft size={14} /> {t('Return to Login')}
              </span>
            </Button>
          )}

          <Button
            onClick={() => navigate(-1)}
            variant="secondary"
            className="w-full text-xs font-bold cursor-pointer bg-gray-50 hover:bg-gray-100 border-gray-300"
          >
            {t('Go Back')}
          </Button>
        </div>
      </div>

      <div className="mt-8 text-center text-[10px] text-slate-400 font-sans font-medium">
        <p>{t('Madhya Pradesh State Election Commission Portal • 404 Error Log Generated')}</p>
      </div>
    </div>
  );
}
