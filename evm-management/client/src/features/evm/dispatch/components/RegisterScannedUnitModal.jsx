import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { evmApi } from '@/api/evm.api';
import { useToast } from '@/components/common/Toast';
import { useAuthStore } from '@/store/authStore';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import FormField from '@/components/common/FormField';
import { Cpu, Save } from 'lucide-react';
import { useTranslation } from '@/components/common/LanguageContext';

const evmSchema = zod.object({
  unitCode: zod
    .string()
    .min(5, 'Unit Code must be at least 5 characters')
    .max(100, 'Unit Code must be under 100 characters')
    .regex(/^[A-Za-z0-9-]+$/, 'Unit Code must be alphanumeric (dashes permitted)'),
  unitType: zod.enum(['CONTROL_UNIT', 'BALLOT_UNIT', 'VVPAT'], {
    errorMap: () => ({ message: 'Please select a valid unit type' }),
  }),
  currentLocationDescription: zod.string().max(255, 'Location details must be under 255 characters').optional(),
  boxNum: zod.string().min(1, 'Box is required'),
});

export default function RegisterScannedUnitModal({ isOpen, onClose, code, onRegisterSuccess }) {
  const { user } = useAuthStore();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  // 1. Fetch total units count to auto-calculate next box
  const evmListQuery = useQuery({
    queryKey: ['evmTotalCount'],
    queryFn: async () => {
      const res = await evmApi.list({ limit: 1 });
      return res.data.pagination?.total || 0;
    },
    enabled: isOpen,
  });

  const totalCount = evmListQuery.data ?? 0;
  const calculatedBox = Math.floor(totalCount / 10) + 1;

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(evmSchema),
    defaultValues: {
      unitCode: '',
      unitType: 'CONTROL_UNIT',
      currentLocationDescription: 'Main Storage Warehouse',
      boxNum: 'Box 1',
    },
  });

  // Pre-fill unit code and calculated box on open
  useEffect(() => {
    if (isOpen) {
      reset({
        unitCode: code || '',
        unitType: 'CONTROL_UNIT',
        currentLocationDescription: 'Main Storage Warehouse',
        boxNum: `Box ${calculatedBox}`,
      });
    }
  }, [isOpen, code, calculatedBox, reset]);

  const registerMutation = useMutation({
    mutationFn: (data) => evmApi.register(data),
    onSuccess: (res) => {
      addToast(t('New EVM unit registered successfully'), 'success');
      queryClient.invalidateQueries(['evmList']);
      queryClient.invalidateQueries(['evmTotalCount']);
      onRegisterSuccess(res.data.data);
      onClose();
    },
    onError: (err) => {
      console.error(err);
      addToast(err.response?.data?.error?.message || t('Failed to register EVM unit.'), 'error');
    },
  });

  const onSubmit = (data) => {
    const finalLocation = data.currentLocationDescription
      ? `${data.currentLocationDescription} - ${data.boxNum}`
      : data.boxNum;

    const payload = {
      unitCode: data.unitCode,
      unitType: data.unitType,
      manufacturer: 'Bharat Electronics Limited (BEL)',
      manufacturingYear: new Date().getFullYear(),
      serialNumber: data.unitCode,
      stateId: user?.stateId || 1,
      districtId: user?.districtId || null,
      locationDescription: finalLocation,
    };

    registerMutation.mutate(payload);
  };

  const typeOptions = [
    { label: t('Control Unit (CU)'), value: 'CONTROL_UNIT' },
    { label: t('Ballot Unit (BU)'), value: 'BALLOT_UNIT' },
    { label: t('VVPAT'), value: 'VVPAT' },
  ];

  const boxOptions = Array.from({ length: 100 }, (_, i) => ({
    label: `${t('Box')} ${i + 1}`,
    value: `Box ${i + 1}`,
  }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('Register Scanned Device')} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-800 text-[11px] font-sans flex gap-2">
          <Cpu size={18} className="shrink-0 mt-0.5 text-amber-500" />
          <div>
            <span className="font-bold">{t('EVM Not Registered')}: </span>
            {t('The unit code')} <strong>{code}</strong> {t('was not found in the inventory system database. Please enter manufacturer details to add it now.')}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label={t('EVM Barcode / QR Code')}
            {...register('unitCode')}
            error={errors.unitCode?.message}
            className="font-mono text-sm"
            disabled
            readOnly
            required
          />

          <FormField
            control={control}
            name="unitType"
            label={t('Device Category Type')}
            options={typeOptions}
            render={Select}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={control}
            name="boxNum"
            label={t('Assigned Storage Box (Capacity 10)')}
            options={boxOptions}
            render={Select}
            isLoading={evmListQuery.isLoading}
            required
          />

          <Input
            label={t('Warehouse location Description')}
            {...register('currentLocationDescription')}
            error={errors.currentLocationDescription?.message}
            helperText={t('Warehouse storage spot (e.g. Room A, Shelf 2 or North District Strongroom)')}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <Button type="button" variant="secondary" onClick={onClose} className="cursor-pointer text-xs">
            {t('Cancel')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="cursor-pointer text-xs shadow-md shadow-saffron-500/10"
            loading={registerMutation.isPending}
          >
            <span className="flex items-center gap-1.5">
              <Save size={14} /> {t('Register & Add to consignment')}
            </span>
          </Button>
        </div>
      </form>
    </Modal>
  );
}
