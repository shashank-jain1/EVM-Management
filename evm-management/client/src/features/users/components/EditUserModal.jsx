import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import { useTranslation } from '@/components/common/LanguageContext';
import { Eye, EyeOff, ShieldAlert } from 'lucide-react';

const editUserSchema = zod
  .object({
    fullName: zod.string().min(3, 'Full name must be at least 3 characters'),
    password: zod
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least 1 uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least 1 number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least 1 special character')
      .or(zod.literal('')),
    confirmPassword: zod.string().optional(),
  })
  .refine(
    (data) => {
      if (data.password) {
        return data.password === data.confirmPassword;
      }
      return true;
    },
    {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    }
  );

export default function EditUserModal({ isOpen, onClose, user, onUpdate }) {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      fullName: '',
      password: '',
      confirmPassword: '',
    },
  });

  // Pre-fill form when user details are passed in
  useEffect(() => {
    if (user) {
      reset({
        fullName: user.fullName || '',
        password: '',
        confirmPassword: '',
      });
    }
  }, [user, reset]);

  const onSubmit = async (data) => {
    const payload = {
      fullName: data.fullName,
      email: null,
      phone: null,
      userType: 'PERMANENT',
      validFrom: null,
      validUntil: null,
    };

    if (data.password) {
      payload.password = data.password;
    }

    try {
      await onUpdate({ id: user.userId, data: payload });
      reset();
      onClose();
    } catch (e) {
      // toast shown in useUsers hook
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${t('Edit Account')}: ${user?.userCode}`} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Info panel */}
        <div className="bg-gray-50 border p-3.5 rounded text-xs text-gray-600 font-sans grid grid-cols-2 gap-4">
          <div>
            <span className="font-semibold block text-gray-500">{t('Jurisdiction')}:</span>
            <span>{user?.districtName ? `${user.districtName}, ` : ''}{user?.stateName || t('Central ECI')}</span>
          </div>
          <div>
            <span className="font-semibold block text-gray-500">{t('Role Assigned')}:</span>
            <span className="font-mono uppercase text-[10px] font-bold text-navy-900 bg-gray-150 border px-1.5 py-0.5 rounded">
              {user?.role ? t(user.role.replace('_', ' ')) : ''}
            </span>
          </div>
        </div>

        <div>
          <Input label={t('Officer Full Name')} {...register('fullName')} error={errors.fullName?.message} required />
        </div>

        {/* Password resets (Optional) */}
        <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-lg space-y-4">
          <div className="text-[11px] text-amber-800 font-sans flex gap-2">
            <ShieldAlert size={16} className="shrink-0 mt-0.5 text-amber-500" />
            <div>
              <span className="font-bold">{t('Password Reset Option')}: </span>
              {t('Leave both password fields blank unless you explicitly want to override the security credential password for this officer.')}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative">
              <Input
                label={t('New Password')}
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                error={errors.password?.message}
                helperText={t('Leave empty to retain current password')}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />
            </div>

            <Input
              label={t('Confirm New Password')}
              type={showPassword ? 'text' : 'password'}
              {...register('confirmPassword')}
              error={errors.confirmPassword?.message}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-5 border-t border-gray-100">
          <Button type="button" variant="secondary" onClick={onClose} className="cursor-pointer text-xs">
            {t('Cancel')}
          </Button>
          <Button type="submit" variant="primary" className="cursor-pointer text-xs shadow-md shadow-saffron-500/10">
            {t('Save Modifications')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
