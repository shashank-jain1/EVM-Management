import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { dispatchApi } from '@/api/dispatch.api';
import { evmApi } from '@/api/evm.api';
import { useToast } from '@/components/common/Toast';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from '@/components/common/LanguageContext';

export function useDispatch() {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(1);
  const [scannedUnits, setScannedUnits] = useState([]);
  const [toStateId, setToStateId] = useState('');
  const [toDistrictId, setToDistrictId] = useState('');
  const [expectedArrival, setExpectedArrival] = useState('');
  const [remarks, setRemarks] = useState('');
  const [createdBatch, setCreatedBatch] = useState(null);
  const [unregisteredCode, setUnregisteredCode] = useState(null);

  // 1. Mutation to create batch
  const createDispatchMutation = useMutation({
    mutationFn: (data) => dispatchApi.create(data),
    onSuccess: (res) => {
      // res.data.data will be the created batch
      setCreatedBatch(res.data.data);
      queryClient.invalidateQueries(['dashboardSummary']);
      queryClient.invalidateQueries(['recentDispatches']);
      queryClient.invalidateQueries(['evmList']);
      addToast('Dispatch batch created successfully', 'success');
      setStep(3); // Advance to completion / print challan step
    },
    onError: (err) => {
      console.error(err);
      addToast(err.response?.data?.error?.message || 'Failed to initiate dispatch consignment.', 'error');
    },
  });

  // 2. Lookup scanned barcode
  const lookupUnit = useCallback(async (code) => {
    if (scannedUnits.some((u) => u.unitCode === code)) {
      addToast(t('Unit is already added to this batch'), 'warning');
      return;
    }

    try {
      const res = await evmApi.lookup(code);
      const unit = res.data.data;

      // Business Rule: Cannot dispatch units currently in transit
      if (unit.currentStatus === 'IN_TRANSIT') {
        addToast(`Unit ${code} is already in transit.`, 'error');
        return;
      }
      
      // Business Rule: Cannot dispatch units that are decommissioned
      if (unit.currentStatus === 'DECOMMISSIONED') {
        addToast(`Unit ${code} has been decommissioned and cannot be dispatched.`, 'error');
        return;
      }

      setScannedUnits((prev) => [...prev, unit]);
      addToast(`Unit ${code} added to consignment`, 'success');
    } catch (err) {
      if (err.response?.status === 404) {
        setUnregisteredCode(code);
      } else {
        console.error(err);
        addToast(err.response?.data?.error?.message || `Failed to look up unit ${code}.`, 'error');
      }
    }
  }, [scannedUnits, addToast, t]);

  const addRegisteredUnitToQueue = useCallback((unit) => {
    setScannedUnits((prev) => [...prev, unit]);
  }, []);

  const removeUnit = useCallback((code) => {
    setScannedUnits((prev) => prev.filter((u) => u.unitCode !== code));
    addToast('Unit removed from queue', 'info');
  }, [addToast]);

  const clearStaged = () => {
    setScannedUnits([]);
    setStep(1);
    setToStateId('');
    setToDistrictId('');
    setExpectedArrival('');
    setRemarks('');
    setCreatedBatch(null);
  };

  const getUnitCounts = () => {
    return scannedUnits.reduce(
      (acc, unit) => {
        if (unit.unitType === 'CONTROL_UNIT') acc.CONTROL_UNIT += 1;
        else if (unit.unitType === 'BALLOT_UNIT') acc.BALLOT_UNIT += 1;
        else if (unit.unitType === 'VVPAT') acc.VVPAT += 1;
        return acc;
      },
      { CONTROL_UNIT: 0, BALLOT_UNIT: 0, VVPAT: 0 }
    );
  };

  const submitDispatch = () => {
    if (scannedUnits.length === 0) {
      addToast('Please scan at least one unit before confirming', 'warning');
      return;
    }
    if (!toStateId) {
      addToast('Please select a destination state', 'warning');
      return;
    }

    const payload = {
      toStateId: parseInt(toStateId),
      toDistrictId: toDistrictId ? parseInt(toDistrictId) : null,
      expectedArrival: expectedArrival ? new Date(expectedArrival).toISOString() : null,
      remarks,
      unitCodes: scannedUnits.map((u) => u.unitCode),
    };

    createDispatchMutation.mutate(payload);
  };

  return {
    step,
    setStep,
    scannedUnits,
    lookupUnit,
    removeUnit,
    toStateId,
    setToStateId,
    toDistrictId,
    setToDistrictId,
    expectedArrival,
    setExpectedArrival,
    remarks,
    setRemarks,
    createdBatch,
    clearStaged,
    submitDispatch,
    unitCounts: getUnitCounts(),
    isSubmitting: createDispatchMutation.isPending,
    unregisteredCode,
    setUnregisteredCode,
    addRegisteredUnitToQueue,
  };
}
