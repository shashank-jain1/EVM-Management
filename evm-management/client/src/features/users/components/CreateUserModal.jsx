import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { useQuery } from '@tanstack/react-query';
import { referenceApi } from '@/api/reports.api';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import FormField from '@/components/common/FormField';
import { useTranslation } from '@/components/common/LanguageContext';
import { Eye, EyeOff } from 'lucide-react';

const userSchema = zod
  .object({
    userCode: zod
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(20, 'Username must be under 20 characters')
      .regex(/^[A-Za-z0-9_-]+$/, 'Alphanumeric, dashes, and underscores only'),
    fullName: zod.string().min(3, 'Full name must be at least 3 characters'),
    role: zod.enum(['STATE_OFFICER', 'DISTRICT_OFFICER'], {
      errorMap: () => ({ message: 'Please select a valid role' }),
    }),
    stateId: zod.string().min(1, 'State is required'),
    districtId: zod.string().optional(),
    password: zod
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least 1 uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least 1 number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least 1 special character'),
    confirmPassword: zod.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export default function CreateUserModal({ isOpen, onClose, onCreate }) {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(userSchema),
    defaultValues: {
      userCode: '',
      fullName: '',
      role: 'DISTRICT_OFFICER',
      stateId: '',
      districtId: '',
      password: '',
      confirmPassword: '',
    },
  });

  const watchRole = watch('role');
  const watchState = watch('stateId');

  // 1. Fetch States
  const statesQuery = useQuery({
    queryKey: ['states'],
    queryFn: async () => {
      const res = await referenceApi.getStates();
      return res.data.data;
    },
    enabled: isOpen,
  });

  // 2. Fetch Districts
  const districtsQuery = useQuery({
    queryKey: ['districts', watchState],
    queryFn: async () => {
      const res = await referenceApi.getDistricts(watchState);
      return res.data.data;
    },
    enabled: isOpen && !!watchState,
  });

  const onSubmit = async (data) => {
    const payload = {
      userCode: data.userCode.toUpperCase(),
      fullName: data.fullName,
      email: null,
      phone: null,
      role: data.role,
      stateId: parseInt(data.stateId),
      districtId: data.role === 'DISTRICT_OFFICER' && data.districtId ? parseInt(data.districtId) : null,
      userType: 'PERMANENT',
      validFrom: null,
      validUntil: null,
      password: data.password,
    };

    try {
      await onCreate(payload);
      reset();
      onClose();
    } catch (e) {
      // toast shown in useUsers hook
    }
  };

  const roleOptions = [
    { label: t('State Officer (Read/Write State)'), value: 'STATE_OFFICER' },
    { label: t('District Officer (Read/Write District)'), value: 'DISTRICT_OFFICER' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('Create Officer Account')} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={control}
            name="role"
            label={t('Officer Role Type')}
            options={roleOptions}
            render={Select}
            required
          />

          <Input
            label={t('Username')}
            {...register('userCode')}
            error={errors.userCode?.message}
            inputClassName="uppercase font-mono text-xs"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={control}
            name="stateId"
            label={t('State')}
            options={(statesQuery.data || []).map((s) => ({
              label: s.stateName ?? s.StateName,
              value: s.stateId != null ? String(s.stateId) : s.StateId != null ? String(s.StateId) : '',
            }))}
            isLoading={statesQuery.isLoading}
            render={Select}
            searchable={true}
            required
          />

          <FormField
            control={control}
            name="districtId"
            label={t('District')}
            options={(districtsQuery.data || []).map((d) => ({
              label: d.districtName ?? d.DistrictName,
              value: d.districtId != null ? String(d.districtId) : d.DistrictId != null ? String(d.DistrictId) : '',
            }))}
            disabled={watchRole === 'STATE_OFFICER' || !watchState}
            isLoading={districtsQuery.isLoading}
            render={Select}
            placeholder={watchRole === 'STATE_OFFICER' ? t('State officers bypass districts') : t('Choose District')}
            searchable={true}
          />
        </div>

        <div>
          <Input label={t('Officer Full Name')} {...register('fullName')} error={errors.fullName?.message} required />
        </div>

        {/* Password grids */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
          <div className="relative">
            <Input
              label={t('Password')}
              type={showPassword ? 'text' : 'password'}
              {...register('password')}
              error={errors.password?.message}
              helperText={t('Min 8 chars, 1 upper, 1 number, 1 special symbol.')}
              required
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
            label={t('Confirm Password')}
            type={showPassword ? 'text' : 'password'}
            {...register('confirmPassword')}
            error={errors.confirmPassword?.message}
            required
          />
        </div>

        <div className="flex justify-end gap-3 pt-5 border-t border-gray-100">
          <Button type="button" variant="secondary" onClick={onClose} className="cursor-pointer text-xs">
            {t('Cancel')}
          </Button>
          <Button type="submit" variant="primary" className="cursor-pointer text-xs shadow-md shadow-saffron-500/10">
            {t('Create Officer Account')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
