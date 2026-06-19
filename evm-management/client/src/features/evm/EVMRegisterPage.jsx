import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { evmApi } from '@/api/evm.api';
import { useToast } from '@/components/common/Toast';
import { useAuthStore } from '@/store/authStore';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import FormField from '@/components/common/FormField';
import Modal from '@/components/common/Modal';
import QRScanner from '@/features/evm/dispatch/components/QRScanner';
import { ArrowLeft, Cpu, Save, ShieldAlert, Camera } from 'lucide-react';
import { useTranslation } from '@/components/common/LanguageContext';

const evmSchema = zod.object({
  unitCode: zod
    .string()
    .min(5, 'Unit Code must be at least 5 characters')
    .max(100, 'Unit Code must be under 100 characters')
    .regex(/^[A-Za-z0-9-]+$/, 'Unit Code must be alphanumeric (dashes permitted)'),
  unitType: zod.enum(['CONTROL_UNIT', 'BALLOT_UNIT', 'DMM'], {
    errorMap: () => ({ message: 'Please select a valid unit type' }),
  }),
  boxNum: zod.string().min(1, 'Box is required'),
});

export default function EVMRegisterPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const [hasScanned, setHasScanned] = useState(false);
  const [manualCode, setManualCode] = useState('');

  // Fetch count of cataloged items to assign box
  const evmListQuery = useQuery({
    queryKey: ['evmTotalCount'],
    queryFn: async () => {
      const res = await evmApi.list({ limit: 1 });
      return res.data.pagination?.total || 0;
    },
  });

  const totalUnits = evmListQuery.data ?? 0;
  const calculatedBox = Math.floor(totalUnits / 10) + 1;

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(evmSchema),
    defaultValues: {
      unitCode: '',
      unitType: 'CONTROL_UNIT',
      boxNum: 'Box 1',
    },
  });

  // Dynamically calculate and select box based on inventory size
  useEffect(() => {
    if (evmListQuery.isSuccess) {
      setValue('boxNum', `Box ${calculatedBox}`);
    }
  }, [evmListQuery.isSuccess, calculatedBox, setValue]);

  const registerMutation = useMutation({
    mutationFn: (data) => evmApi.register(data),
    onSuccess: (res) => {
      addToast(t('New EVM unit registered successfully'), 'success');
      queryClient.invalidateQueries(['evmList']);
      navigate(`/evm/${res.data.data.unitId}`);
    },
    onError: (err) => {
      console.error(err);
      addToast(err.response?.data?.error?.message || t('Failed to register EVM unit. It may already exist.'), 'error');
    },
  });

  const onSubmit = (data) => {
    const payload = {
      unitCode: data.unitCode,
      unitType: data.unitType,
      manufacturer: 'Bharat Electronics Limited (BEL)',
      manufacturingYear: new Date().getFullYear(),
      serialNumber: data.unitCode,
      stateId: user?.stateId || 1,
      districtId: user?.districtId || null,
      locationDescription: data.boxNum,
    };

    registerMutation.mutate(payload);
  };

  const typeOptions = [
    { label: t('Control Unit (CU)'), value: 'CONTROL_UNIT' },
    { label: t('Ballot Unit (BU)'), value: 'BALLOT_UNIT' },
    { label: t('DMM'), value: 'DMM' },
  ];

  if (!hasScanned) {
    return (
      <div className="space-y-6 max-w-md mx-auto">
        {/* Header bar */}
        <div className="flex justify-between items-center bg-white border border-gray-200 p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/evm')}
              className="p-1 h-8 w-8 hover:bg-gray-100 flex items-center justify-center cursor-pointer shrink-0 border border-gray-200 rounded-md bg-transparent text-navy-700 transition-colors"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <h2 className="text-base font-bold font-sans text-navy-900 leading-tight">
                {t('Register New EVM')}
              </h2>
              <p className="text-xs text-gray-500 font-sans mt-0.5">
                {t('Scan the EVM barcode/QR code to start registration.')}
              </p>
            </div>
          </div>
        </div>

        {/* Scanner Container */}
        <div className="bg-white border border-gray-200 border-t-4 border-t-saffron-500 rounded-lg p-5 shadow-sm space-y-5">
          <div className="space-y-4 py-2">
            <p className="text-xs text-gray-500 text-center font-sans">
              {t('Align the EVM unit barcode or QR code sticker inside the scanner frame below.')}
            </p>
            <div className="max-w-md mx-auto overflow-hidden rounded-lg border border-gray-200 shadow-inner">
              <QRScanner
                onScanSuccess={(code) => {
                  setValue('unitCode', code.toUpperCase(), { shouldValidate: true });
                  setHasScanned(true);
                  addToast(`${t('Successfully scanned unit code')}: ${code}`, 'success');
                }}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 text-center">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{t('Or Enter Manually')}</p>
            <div className="flex gap-2 max-w-md mx-auto">
              <Input
                placeholder={t('Enter Unit Code (e.g. CU-192A)...')}
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="font-mono text-xs uppercase flex-1 h-9"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  if (manualCode.trim().length >= 5) {
                    setValue('unitCode', manualCode.trim().toUpperCase(), { shouldValidate: true });
                    setHasScanned(true);
                  } else {
                    addToast(t('Unit Code must be at least 5 characters'), 'warning');
                  }
                }}
                className="h-9 font-bold px-3 shrink-0 cursor-pointer text-xs"
              >
                {t('Continue')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header bar */}
      <div className="flex justify-between items-center bg-white border border-gray-200 p-4 rounded-lg shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setHasScanned(false)}
            className="p-1 h-8 w-8 hover:bg-gray-100 flex items-center justify-center cursor-pointer shrink-0 border border-gray-200 rounded-md bg-transparent text-navy-700 transition-colors"
            title={t('Rescan')}
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h2 className="text-base font-bold font-sans text-navy-900 leading-tight">
              {t('Register New EVM')}
            </h2>
            <p className="text-xs text-gray-500 font-sans mt-0.5">
              {t('Insert a new Electronic Voting Machine unit record into the central ECI system.')}
            </p>
          </div>
        </div>
      </div>

      {/* Form Container */}
      <div className="bg-white border border-gray-200 border-t-4 border-t-saffron-500 rounded-lg p-6 shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded text-blue-800 text-[11px] font-sans flex gap-2">
            <Cpu size={18} className="shrink-0 mt-0.5 text-blue-500" />
            <div>
              <span className="font-bold">{t('Notice')}: </span>
              {t("Registered units are assigned to the current user's state/district location by default. This registry update will be logged under audit trail.")}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={t('EVM Barcode / QR Code (Unit Code)')}
              {...register('unitCode')}
              error={errors.unitCode?.message}
              helperText={t('Unique barcode/QR text scanned from physical device labels.')}
              className="font-mono text-sm"
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
              options={Array.from({ length: 100 }, (_, i) => ({
                label: `${t('Box')} ${i + 1}`,
                value: `Box ${i + 1}`,
              }))}
              render={Select}
              isLoading={evmListQuery.isLoading}
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-5 border-t border-gray-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setHasScanned(false)}
              className="cursor-pointer"
            >
              {t('Rescan')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="cursor-pointer shadow-md shadow-saffron-500/10"
              loading={registerMutation.isPending}
            >
              <span className="flex items-center gap-1.5">
                <Save size={15} /> {t('Register & Save Unit')}
              </span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
