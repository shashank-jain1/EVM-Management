import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from '@/components/common/LanguageContext';
import { authApi } from '@/api/auth.api';
import { Eye, EyeOff, ShieldAlert, User, Lock, LogIn } from 'lucide-react';

const loginSchema = zod.object({
  userCode: zod.string().min(3, 'User ID must be at least 3 characters'),
  password: zod.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: zod.boolean().optional(),
});

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const { language, setLanguage, t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      userCode: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data) => {
    setErrorMessage('');
    setIsSubmitting(true);
    try {
      const res = await authApi.login(data.userCode, data.password);
      if (res.data && res.data.success) {
        const loginData = res.data.data;
        login(loginData.user, loginData.accessToken, loginData.refreshToken);
        navigate('/dashboard');
      } else {
        setErrorMessage(res.data?.message || 'Invalid credentials or account deactivated.');
      }
    } catch (err) {
      console.error(err);
      if (err.response?.data?.error?.message) {
        setErrorMessage(err.response.data.error.message);
      } else {
        setErrorMessage('Failed to connect to authentication server. Please check database connection.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 shadow-[0_12px_40px_rgba(0,0,0,0.06)] rounded-2xl p-8 md:p-10 relative overflow-hidden transition-all duration-300">
      {/* Tri-color government flag top border accent */}
      <div className="absolute top-0 inset-x-0 h-1 flex">
        <div className="flex-1 bg-[#FF9933]" />
        <div className="flex-1 bg-slate-100" />
        <div className="flex-1 bg-[#128807]" />
      </div>

      {/* Language Toggle Widget */}
      <div className="absolute top-4 right-4 z-20 flex gap-1 bg-slate-100 p-0.5 rounded-full border border-slate-200/60">
        <button
          type="button"
          onClick={() => setLanguage('en')}
          className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider transition-all duration-150 cursor-pointer ${
            language === 'en'
              ? 'bg-saffron-500 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          EN
        </button>
        <button
          type="button"
          onClick={() => setLanguage('hi')}
          className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider transition-all duration-150 cursor-pointer ${
            language === 'hi'
              ? 'bg-saffron-500 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          हिन्दी
        </button>
      </div>

      {/* Branding and ECI Logo Header */}
      <div className="text-center mb-8 pt-4">
        <div className="flex justify-center mb-4">
          <img src="/logo.png" className="h-16 w-auto object-contain" alt="ECI Logo" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-800 font-sans tracking-tight">
          {t('EVM Inventory Management system')}
        </h2>
        <p className="text-sm text-slate-500 font-sans font-semibold tracking-wide mt-2.5 uppercase">
          {t('Madhya Pradesh State Election Commission')}
        </p>
      </div>

      {/* Error Alert Panel */}
      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex gap-3 items-start animate-fade-in">
          <ShieldAlert size={20} className="shrink-0 mt-0.5 text-red-500" />
          <div className="font-sans leading-normal">
            <span className="font-bold text-red-600">{t('Authentication Failure:')} </span>
            {t(errorMessage)}
          </div>
        </div>
      )}

      {/* Sign In Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* User Code Input */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">
            {t('Officer User ID (User Code)')}
          </label>
          <div className="relative group">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-saffron-600 transition-colors pointer-events-none">
              <User size={20} className="stroke-[1.75]" />
            </div>
            <input
              type="text"
              autoFocus
              {...register('userCode')}
              placeholder=""
              className={`w-full bg-white text-slate-900 rounded-xl border pl-11 pr-4 py-2.5 h-12 text-base font-sans tracking-wide uppercase transition-all duration-200 focus:outline-none placeholder-slate-400 ${
                errors.userCode
                  ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500/20'
                  : 'border-slate-300 focus:border-saffron-500 focus:ring-1 focus:ring-saffron-500/20 hover:border-slate-400'
              }`}
            />
          </div>
          {errors.userCode && (
            <p className="text-sm text-red-500 mt-0.5">{t(errors.userCode.message)}</p>
          )}
        </div>

        {/* Password Input */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">
            {t('Password')}
          </label>
          <div className="relative group">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-saffron-600 transition-colors pointer-events-none">
              <Lock size={20} className="stroke-[1.75]" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              {...register('password')}
              placeholder="••••••••"
              className={`w-full bg-white text-slate-900 rounded-xl border pl-11 pr-11 py-2.5 h-12 text-base font-sans tracking-wide transition-all duration-200 focus:outline-none placeholder-slate-400 ${
                errors.password
                  ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500/20'
                  : 'border-slate-300 focus:border-saffron-500 focus:ring-1 focus:ring-saffron-500/20 hover:border-slate-400'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 transition-colors focus:outline-none"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-red-500 mt-0.5">{t(errors.password.message)}</p>
          )}
        </div>

        {/* Remember Me Session */}
        <div className="flex items-center justify-between py-1">
          <label className="flex items-center text-sm text-slate-600 font-sans select-none cursor-pointer group">
            <input
              type="checkbox"
              {...register('rememberMe')}
              className="mr-2.5 rounded-md border-slate-300 text-saffron-500 focus:ring-saffron-500/40 focus:ring-offset-0 cursor-pointer h-4 w-4 transition-all"
            />
            <span className="group-hover:text-slate-900 transition-colors">{t('Remember this session')}</span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-4 h-12 bg-saffron-500 hover:bg-saffron-600 text-white font-bold text-base tracking-wide rounded-xl shadow-md shadow-saffron-500/10 active:scale-[0.98] transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border-0"
        >
          {isSubmitting ? (
            <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
          ) : (
            <>
              <LogIn size={20} />
              {t('Sign In')}
            </>
          )}
        </button>
      </form>
    </div>
  );
}
