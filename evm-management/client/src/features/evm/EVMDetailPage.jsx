import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { evmApi } from '@/api/evm.api';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import Spinner from '@/components/common/Spinner';
import Timeline from '@/components/common/Timeline';
import Modal from '@/components/common/Modal';
import Select from '@/components/common/Select';
import Input from '@/components/common/Input';
import { useToast } from '@/components/common/Toast';
import { useAuthStore } from '@/store/authStore';
import { ArrowLeft, RefreshCw, Calendar, Tag, ShieldAlert, FileText, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslation } from '@/components/common/LanguageContext';

export default function EVMDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const isOfficer = user?.role === 'ADMIN' || user?.role === 'STATE_OFFICER' || user?.role === 'DISTRICT_OFFICER';

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [locationRemarks, setLocationRemarks] = useState('');

  // 1. Fetch EVM Unit Details
  const evmQuery = useQuery({
    queryKey: ['evmUnit', id],
    queryFn: async () => {
      const res = await evmApi.get(id);
      return res.data.data; // returns { unitId, unitCode, unitType, manufacturer, manufacturingYear, serialNumber, currentStatus, currentStateId, currentStateName, currentDistrictId, currentDistrictName, currentLocationDescription, createdAt }
    },
  });

  // 2. Fetch EVM Unit History
  const historyQuery = useQuery({
    queryKey: ['evmHistory', id],
    queryFn: async () => {
      const res = await evmApi.getHistory(id);
      return res.data.data; // returns array of movement history records
    },
  });

  // 3. Status Update Mutation
  const updateStatusMutation = useMutation({
    mutationFn: (data) => evmApi.updateStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['evmUnit', id]);
      queryClient.invalidateQueries(['evmHistory', id]);
      addToast(t('EVM status updated successfully'), 'success');
      setStatusModalOpen(false);
      setLocationRemarks('');
      setNewStatus('');
    },
    onError: (err) => {
      console.error(err);
      addToast(err.response?.data?.error?.message || t('Failed to update EVM status'), 'error');
    },
  });

  const handleUpdateStatus = (e) => {
    e.preventDefault();
    if (!newStatus) {
      addToast(t('Please select a new status'), 'warning');
      return;
    }
    updateStatusMutation.mutate({
      status: newStatus,
      remarks: locationRemarks,
      stateId: evmQuery.data.currentStateId,
      districtId: evmQuery.data.currentDistrictId,
      locationDescription: evmQuery.data.currentLocationDescription,
    });
  };

  const syncDetails = () => {
    queryClient.invalidateQueries(['evmUnit', id]);
    queryClient.invalidateQueries(['evmHistory', id]);
  };

  if (evmQuery.isLoading || historyQuery.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3">
        <Spinner size="lg" />
        <p className="text-xs text-gray-500 font-sans">{t('Fetching device details and lifecycle history...')}</p>
      </div>
    );
  }

  if (evmQuery.isError || !evmQuery.data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-6 bg-white border border-gray-200 rounded-lg max-w-lg mx-auto shadow-sm">
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-4 border border-red-100 animate-pulse">
          <ShieldAlert size={24} />
        </div>
        <h3 className="text-base font-bold text-gray-900 font-sans font-sans">{t('EVM Record Not Found')}</h3>
        <p className="text-xs text-gray-500 font-sans mt-2 max-w-sm">
          {t('The requested EVM unit registry ID could not be loaded. Ensure the barcode exists in the database.')}
        </p>
        <Button onClick={() => navigate('/evm')} variant="secondary" className="mt-6 cursor-pointer">
          <span className="flex items-center gap-1.5"><ArrowLeft size={14} /> {t('Back to Inventory')}</span>
        </Button>
      </div>
    );
  }

  const evm = evmQuery.data;
  const history = historyQuery.data || [];

  // Allowed status options based on role hierarchy and current status
  const getStatusOptions = () => {
    const options = [];
    return options;
  };

  const statusChangeAllowed = false;

  return (
    <div className="space-y-6">
      {/* Detail Header / Nav Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-gray-200 p-4 rounded-lg shadow-sm">
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
              {t('EVM Unit Detail Card')}
            </h2>
            <p className="text-xs text-gray-500 font-sans mt-0.5">
              {t('Unique Code')}: <span className="font-mono text-xs font-bold text-gray-800">{evm.unitCode}</span>
            </p>
          </div>
        </div>
        
        <div className="flex gap-2 self-stretch sm:self-auto">
          <button
            onClick={syncDetails}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded transition-colors cursor-pointer"
          >
            <RefreshCw size={12} /> {t('Sync Device Details')}
          </button>
          
          {statusChangeAllowed && (
            <Button
              onClick={() => setStatusModalOpen(true)}
              variant="primary"
              className="text-xs font-bold shadow-sm shrink-0 cursor-pointer"
            >
              {t('Update Device Status')}
            </Button>
          )}
        </div>
      </div>

      {/* Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Metadata Panel */}
        <div className="lg:col-span-1 bg-white border border-gray-200 border-t-4 border-t-saffron-500 rounded-lg p-5 shadow-sm space-y-5">
          <div className="pb-2 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-xs font-bold font-sans text-navy-950 uppercase tracking-wide">
              {t('Device Registration info')}
            </h3>
            <Badge status={evm.currentStatus} />
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-[10px] text-gray-400 font-sans uppercase font-semibold">{t('Unit Type')}</span>
              <p className="text-xs font-bold text-gray-800 mt-0.5">
                {t(evm.unitType?.replace('_', ' '))}
              </p>
            </div>

            <div>
              <span className="text-[10px] text-gray-400 font-sans uppercase font-semibold">{t('Manufacturer')}</span>
              <p className="text-xs font-medium text-gray-800 mt-0.5">
                {t(evm.manufacturer)} ({t('Year')}: {evm.manufacturingYear})
              </p>
            </div>

            <div>
              <span className="text-[10px] text-gray-400 font-sans uppercase font-semibold">{t('Serial Number')}</span>
              <p className="text-xs font-mono font-semibold text-gray-800 mt-0.5">
                {evm.serialNumber}
              </p>
            </div>

            <div>
              <span className="text-[10px] text-gray-400 font-sans uppercase font-semibold">{t('Current Location')}</span>
              <p className="text-xs font-semibold text-gray-800 mt-0.5 leading-relaxed">
                {evm.currentDistrictName ? `${evm.currentDistrictName}, ` : ''}{evm.currentStateName || t('Central Headquarters')}
              </p>
              {evm.currentLocationDescription && (
                <p className="text-[11px] text-gray-500 font-sans mt-0.5 italic">
                  &ldquo;{evm.currentLocationDescription}&rdquo;
                </p>
              )}
            </div>

            {evm.boxNumber && (
              <div>
                <span className="text-[10px] text-gray-400 font-sans uppercase font-semibold">{t('Storage Box')}</span>
                <p className="text-xs font-bold text-indigo-600 mt-0.5">
                  <span className="bg-indigo-50 px-2 py-0.5 rounded font-mono">Box {evm.boxNumber}</span>
                </p>
              </div>
            )}

            <div className="pt-2 border-t border-gray-100">
              <span className="text-[10px] text-gray-400 font-sans uppercase font-semibold">{t('Registry Creation')}</span>
              <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1 font-mono">
                <Calendar size={12} className="text-gray-400" />
                <span>{evm.createdAt ? format(new Date(evm.createdAt), 'dd MMM yyyy HH:mm') : '—'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Vertical Lifecycle Timeline Panel */}
        <div className="lg:col-span-2 bg-white border border-gray-200 border-t-4 border-t-navy-950 rounded-lg p-5 shadow-sm">
          <div className="pb-3 border-b border-gray-100 mb-5 flex items-center justify-between">
            <h3 className="text-xs font-bold font-sans text-navy-950 uppercase tracking-wide">
              {t('Device Lifecycle Movement History (Immutable)')}
            </h3>
            <span className="text-[10px] font-mono text-gray-400 font-semibold uppercase bg-gray-50 border px-1.5 py-0.5 rounded">
              {history.length} {t('Events Logged')}
            </span>
          </div>

          <div className="relative pl-2">
            {history.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400 font-sans">
                {t('No tracking events recorded.')}
              </div>
            ) : (
              <Timeline items={history} />
            )}
          </div>
        </div>
      </div>

      {/* Modal - Update Status */}
      <Modal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title={t('Update Device Lifecycle Status')}
        size="md"
      >
        <form onSubmit={handleUpdateStatus} className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-800 text-[11px] font-sans flex gap-2">
            <ShieldAlert size={16} className="shrink-0 mt-0.5 text-amber-500" />
            <div>
              <span className="font-bold">{t('Important Notice')}: </span>
              {t('Status updates write permanent lifecycle audit history items. Do not use status updates for normal batch dispatches or batch receipts.')}
            </div>
          </div>

          <div>
            <span className="text-[10px] text-gray-400 font-sans uppercase font-semibold">{t('Current State')}</span>
            <div className="flex gap-2 items-center mt-1.5">
              <Badge status={evm.currentStatus} />
              <span className="text-xs text-gray-600 font-sans">&rarr; {t('select next state below:')}</span>
            </div>
          </div>

          <Select
            label={t('Target Status')}
            value={newStatus}
            onChange={setNewStatus}
            options={getStatusOptions()}
            placeholder={t('Choose Status Update Option')}
            required
          />

          <Input
            label={t('Remarks / Action Details')}
            value={locationRemarks}
            onChange={(e) => setLocationRemarks(e.target.value)}
            helperText={t("State specific reasons for this device override (e.g. 'Found screen flickering during test', 'Battery assembly swap completed')")}
            maxLength={255}
            required
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setStatusModalOpen(false)}
              className="cursor-pointer"
            >
              {t('Cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="cursor-pointer"
              loading={updateStatusMutation.isPending}
            >
              {t('Commit Status Update')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
