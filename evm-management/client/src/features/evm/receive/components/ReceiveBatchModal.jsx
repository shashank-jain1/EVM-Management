import React, { useState, useEffect } from 'react';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import Select from '@/components/common/Select';
import Input from '@/components/common/Input';
import { useToast } from '@/components/common/Toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dispatchApi } from '@/api/dispatch.api';
import { Check, ClipboardCheck, Info, AlertTriangle } from 'lucide-react';
import { useTranslation } from '@/components/common/LanguageContext';

export default function ReceiveBatchModal({ isOpen, onClose, batch }) {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  // Fetch full batch details (with items)
  const { data: fullBatch, isLoading } = useQuery({
    queryKey: ['dispatchBatch', batch?.batchId],
    queryFn: async () => {
      const res = await dispatchApi.get(batch.batchId);
      return res.data.data;
    },
    enabled: !!batch?.batchId && isOpen,
  });

  // Storing state of received items: { [itemId]: { received: bool, condition: 'GOOD'|'DAMAGED'|'FAULTY', remarks: string } }
  const [itemsState, setItemsState] = useState({});

  useEffect(() => {
    if (fullBatch && fullBatch.items) {
      const initialState = {};
      fullBatch.items.forEach((item) => {
        initialState[item.itemId] = {
          itemId: item.itemId,
          unitId: item.unitId,
          unitCode: item.unitCode,
          received: true, // Default to true for easy check-offs
          condition: 'GOOD',
          remarks: '',
        };
      });
      setItemsState(initialState);
    }
  }, [fullBatch]);

  const receiveMutation = useMutation({
    mutationFn: (data) => dispatchApi.receive(batch.batchId, data),
    onSuccess: () => {
      addToast(t('Batch receipt logged and registered in inventory'), 'success');
      queryClient.invalidateQueries(['pendingReceipts']);
      queryClient.invalidateQueries(['dashboardSummary']);
      queryClient.invalidateQueries(['evmList']);
      onClose();
    },
    onError: (err) => {
      console.error(err);
      addToast(err.response?.data?.error?.message || t('Failed to log batch receipt'), 'error');
    },
  });

  if (!batch) return null;

  const handleCheckboxChange = (itemId, val) => {
    setItemsState((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], received: val },
    }));
  };

  const handleConditionChange = (itemId, val) => {
    setItemsState((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], condition: val },
    }));
  };

  const handleRemarksChange = (itemId, val) => {
    setItemsState((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], remarks: val },
    }));
  };

  const handleSelectAll = (val) => {
    setItemsState((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((key) => {
        updated[key].received = val;
      });
      return updated;
    });
  };

  const handleMarkAllGood = () => {
    setItemsState((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((key) => {
        updated[key].condition = 'GOOD';
      });
      return updated;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const itemsPayload = Object.values(itemsState).map((item) => ({
      itemId: item.itemId,
      unitId: item.unitId,
      received: item.received,
      condition: item.received ? item.condition : null,
      remarks: item.remarks,
    }));

    const unreceivedCount = itemsPayload.filter((i) => !i.received).length;
    
    if (unreceivedCount > 0 && !window.confirm(`${t('Warning')}: ${t('You are flagging')} ${unreceivedCount} ${t('units as MISSING. This triggers an immediate security alert. Continue?')}`)) {
      return;
    }

    receiveMutation.mutate({
      items: itemsPayload,
    });
  };

  const conditionOptions = [
    { label: t('Good (Sealed)'), value: 'GOOD' },
    { label: t('Damaged (Broken Seal)'), value: 'DAMAGED' },
    { label: t('Faulty (Electronic Issue)'), value: 'FAULTY' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${t('Confirm Shipment')}: ${batch.batchCode}`}
      size="xl"
    >
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-saffron-500" />
          <p className="text-xs text-gray-500 font-sans">{t('Loading shipment items from EVM database...')}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
        {/* Info summary */}
        <div className="bg-gray-50 border p-3.5 rounded text-xs text-gray-600 font-sans grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <span className="font-semibold block text-gray-500">{t('Shipping Origin')}:</span>
            <span>{batch.fromDistrictName ? `${batch.fromDistrictName}, ` : ''}{batch.fromStateName}</span>
          </div>
          <div>
            <span className="font-semibold block text-gray-500">{t('Dispatched Date')}:</span>
            <span>{batch.dispatchDate ? new Date(batch.dispatchDate).toLocaleDateString() : '—'}</span>
          </div>
          <div>
            <span className="font-semibold block text-gray-500">{t('Expected Arrival')}:</span>
            <span>{batch.expectedArrival ? new Date(batch.expectedArrival).toLocaleDateString() : '—'}</span>
          </div>
          <div>
            <span className="font-semibold block text-gray-500">{t('Total Units')}:</span>
            <span className="font-mono font-bold text-navy-900">{batch.totalUnits} {t('Units')}</span>
          </div>
        </div>

        {/* Global toggles */}
        <div className="flex gap-3 justify-end items-center text-xs pb-1 border-b border-gray-100">
          <button
            type="button"
            onClick={() => handleSelectAll(true)}
            className="text-saffron-500 hover:text-saffron-600 font-bold"
          >
            {t('Mark All Received')}
          </button>
          <span className="text-gray-300">|</span>
          <button
            type="button"
            onClick={() => handleSelectAll(false)}
            className="text-gray-500 hover:text-gray-700 font-bold"
          >
            {t('Mark All Missing')}
          </button>
          <span className="text-gray-300">|</span>
          <button
            type="button"
            onClick={handleMarkAllGood}
            className="text-emerald-600 hover:text-emerald-700 font-bold"
          >
            {t('Mark All Sealed Good')}
          </button>
        </div>

        {/* Table list */}
        <div className="max-h-[45vh] overflow-y-auto border border-gray-200 rounded">
          <table className="min-w-full border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 border-b text-gray-500 font-semibold select-none">
                <th className="px-3 py-2.5 text-left w-12">{t('Recd.')}</th>
                <th className="px-3 py-2.5 text-left">{t('Unit Code')}</th>
                <th className="px-3 py-2.5 text-left w-32">{t('Type')}</th>
                <th className="px-3 py-2.5 text-left w-48">{t('Condition on Receipt')}</th>
                <th className="px-3 py-2.5 text-left">{t('Remarks')}</th>
              </tr>
            </thead>
            <tbody>
              {fullBatch?.items?.map((item) => {
                const state = itemsState[item.itemId] || { received: true, condition: 'GOOD', remarks: '' };
                return (
                  <tr
                    key={item.itemId}
                    className={`border-b border-gray-150 hover:bg-gray-50/50 transition-colors ${
                      !state.received ? 'bg-red-50/20' : ''
                    }`}
                  >
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={state.received}
                        onChange={(e) => handleCheckboxChange(item.itemId, e.target.checked)}
                        className="rounded border-gray-300 text-saffron-500 focus:ring-saffron-500 cursor-pointer h-4 w-4"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <span className="font-mono font-bold text-gray-800">{item.unitCode}</span>
                      <p className="text-[10px] text-gray-400 font-mono">SN: {item.serialNumber}</p>
                    </td>
                    <td className="px-3 py-2">
                      <Badge status={item.unitType} />
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={state.condition}
                        onChange={(e) => handleConditionChange(item.itemId, e.target.value)}
                        disabled={!state.received}
                        className="w-full text-xs font-sans text-gray-700 border border-gray-300 rounded bg-white px-2 py-1 focus:ring-1 focus:ring-saffron-500 focus:outline-none disabled:bg-gray-100 disabled:text-gray-400 cursor-pointer"
                      >
                        {conditionOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={state.remarks}
                        onChange={(e) => handleRemarksChange(item.itemId, e.target.value)}
                        placeholder={t('E.g. Lock seal intact')}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-saffron-500 focus:outline-none"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Audit Disclaimer */}
        <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-800 text-[11px] font-sans flex gap-2">
          <Info size={16} className="shrink-0 mt-0.5 text-amber-500" />
          <div>
            <span className="font-bold">{t('Security Disclaimer')}: </span>
            {t('Submitting receipt changes the status of successfully checked devices to IN_WAREHOUSE at your location. Missing units are locked immediately and flagged for investigation.')}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="cursor-pointer text-xs"
          >
            {t('Cancel')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="cursor-pointer text-xs shadow-md shadow-saffron-500/10"
            loading={receiveMutation.isPending}
          >
            <span className="flex items-center gap-1.5">
              <ClipboardCheck size={14} /> {t('Log Batch Receipt')}
            </span>
          </Button>
        </div>
        </form>
      )}
    </Modal>
  );
}
