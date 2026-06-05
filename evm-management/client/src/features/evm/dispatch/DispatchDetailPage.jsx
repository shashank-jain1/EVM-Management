import React, { useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dispatchApi } from '@/api/dispatch.api';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import Spinner from '@/components/common/Spinner';
import Table from '@/components/common/Table';
import Modal from '@/components/common/Modal';
import Input from '@/components/common/Input';
import { useToast } from '@/components/common/Toast';
import { useAuthStore } from '@/store/authStore';
import DispatchChallan from './components/DispatchChallan';
import { useReactToPrint } from 'react-to-print';
import { ArrowLeft, Printer, RefreshCw, AlertTriangle, ShieldAlert, CheckCircle, Calendar, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslation } from '@/components/common/LanguageContext';

export default function DispatchDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const { user } = useAuthStore();
  const { t } = useTranslation();

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const challanRef = useRef(null);

  // 1. Fetch Batch Details (returns { batchId, batchCode, dispatchDate, expectedArrival, actualArrival, dispatchStatus, remarks, totalUnits, dispatchedByName, dispatchedByCode, fromStateName, fromDistrictName, toStateName, toDistrictName, receivedByName, items: [] })
  const batchQuery = useQuery({
    queryKey: ['dispatchBatch', id],
    queryFn: async () => {
      const res = await dispatchApi.get(id);
      return res.data.data;
    },
  });

  // 2. Cancel batch mutation
  const cancelBatchMutation = useMutation({
    mutationFn: (reason) => dispatchApi.cancel(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries(['dispatchBatch', id]);
      queryClient.invalidateQueries(['dashboardSummary']);
      addToast(t('Dispatch batch cancelled successfully'), 'success');
      setCancelModalOpen(false);
      setCancelReason('');
    },
    onError: (err) => {
      console.error(err);
      addToast(err.response?.data?.error?.message || t('Failed to cancel dispatch batch'), 'error');
    },
  });

  // 3. Print challan trigger
  const handlePrint = useReactToPrint({
    content: () => challanRef.current,
    documentTitle: `ECI-CHALLAN-${batchQuery.data?.batchCode || 'PRINT'}`,
  });

  const handleCancelSubmit = (e) => {
    e.preventDefault();
    if (!cancelReason.trim()) {
      addToast(t('Please enter a cancellation reason'), 'warning');
      return;
    }
    cancelBatchMutation.mutate(cancelReason.trim());
  };

  if (batchQuery.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3">
        <Spinner size="lg" />
        <p className="text-xs text-gray-500 font-sans">{t('Retrieving shipping details...')}</p>
      </div>
    );
  }

  if (batchQuery.isError || !batchQuery.data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-6 bg-white border border-gray-200 rounded-lg max-w-lg mx-auto shadow-sm">
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-4 border border-red-100">
          <ShieldAlert size={24} />
        </div>
        <h3 className="text-base font-bold text-gray-900 font-sans">{t('Batch Record Not Found')}</h3>
        <p className="text-xs text-gray-500 font-sans mt-2 max-w-sm">
          {t('The requested dispatch batch or challan code does not exist in ECI records.')}
        </p>
        <Button onClick={() => navigate('/dashboard')} variant="secondary" className="mt-6 cursor-pointer">
          <span className="flex items-center gap-1.5"><ArrowLeft size={14} /> {t('Back to Dashboard')}</span>
        </Button>
      </div>
    );
  }

  const batch = batchQuery.data;
  const items = batch.items || [];

  // Rules: Only ADMIN or the shipping officer can cancel, and only when status is PENDING or IN_TRANSIT
  const canCancel =
    (user?.role === 'ADMIN' || user?.userCode === batch.dispatchedByCode) &&
    (batch.dispatchStatus === 'PENDING' || batch.dispatchStatus === 'IN_TRANSIT');

  const columns = [
    {
      header: t('Sl No.'),
      accessor: 'unitCode',
      render: (val, row, idx) => <span className="text-xs text-gray-500">{idx + 1}</span>,
    },
    {
      header: t('Box Number'),
      accessor: 'remarks',
      render: (val, row, idx) => {
        const boxVal = row.remarks ?? row.Remarks;
        return (
          <span className="font-mono text-xs font-bold text-navy-700">
            {boxVal || `${t('Box')} ${Math.floor(idx / 10) + 1}`}
          </span>
        );
      },
    },
    {
      header: t('Unit Code'),
      accessor: 'unitCode',
      render: (val, row) => (
        <span className="font-mono text-xs font-bold text-gray-800">
          {val}
        </span>
      ),
    },
    {
      header: t('Unit Type'),
      accessor: 'unitType',
      render: (val) => <Badge status={val} />,
    },
    {
      header: t('Serial Number'),
      accessor: 'serialNumber',
      render: (val) => <span className="font-mono text-xs text-gray-500">{val || '—'}</span>,
    },
    {
      header: t('Condition on Receipt'),
      accessor: 'conditionOnReceipt',
      render: (val, row) => {
        if (batch.dispatchStatus !== 'RECEIVED' && batch.dispatchStatus !== 'PARTIALLY_RECEIVED') {
          return <span className="text-xs text-gray-400 italic">{t('Not Received Yet')}</span>;
        }
        return (
          <span
            className={`text-xs font-semibold ${
              val === 'GOOD' ? 'text-emerald-600' : 'text-red-600'
            }`}
          >
            {val || t('MISSING')}
          </span>
        );
      },
    },
    {
      header: t('Receipt Remarks'),
      accessor: 'itemRemarks',
      render: (val) => <span className="text-xs text-gray-600 italic truncate max-w-[150px] block">{val || '—'}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header navigations */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-gray-200 p-4 rounded-lg shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-1 h-8 w-8 hover:bg-gray-100 flex items-center justify-center cursor-pointer shrink-0 border border-gray-200 rounded-md bg-transparent text-navy-700 transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h2 className="text-base font-bold font-sans text-navy-900 leading-tight">
              {t('Shipment Details')}
            </h2>
            <p className="text-xs text-gray-500 font-sans mt-0.5">
              {t('Batch Code')}: <span className="font-mono text-xs font-bold text-gray-800">{batch.batchCode}</span>
            </p>
          </div>
        </div>

        <div className="flex gap-2 self-stretch sm:self-auto">
          <button
            onClick={() => queryClient.invalidateQueries(['dispatchBatch', id])}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded transition-colors cursor-pointer"
          >
            <RefreshCw size={12} /> {t('Sync')}
          </button>
          
          <Button
            onClick={handlePrint}
            variant="secondary"
            className="bg-white border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-bold shadow-sm shrink-0 cursor-pointer"
          >
            <span className="flex items-center gap-1.5"><Printer size={14} /> {t('Print Challan')}</span>
          </Button>

          {canCancel && (
            <Button
              onClick={() => setCancelModalOpen(true)}
              variant="danger"
              className="text-xs font-bold shadow-sm shrink-0 cursor-pointer"
            >
              <span className="flex items-center gap-1.5"><Trash2 size={14} /> {t('Cancel Shipment')}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core batch details */}
        <div className="lg:col-span-1 bg-white border border-gray-200 border-t-4 border-t-saffron-500 rounded-lg p-5 shadow-sm space-y-4">
          <div className="pb-2 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-xs font-bold font-sans text-navy-955 uppercase tracking-wide">
              {t('Shipping Summary')}
            </h3>
            <Badge status={batch.dispatchStatus} />
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <span className="text-[10px] text-gray-400 font-sans uppercase font-semibold">{t('Origin Warehouse')}</span>
              <p className="font-semibold text-gray-800 mt-0.5 leading-normal">
                {batch.fromDistrictName ? `${batch.fromDistrictName}, ` : ''}{batch.fromStateName}
              </p>
              <p className="text-[10px] text-gray-500 font-sans mt-0.5 font-mono">
                {t('By')}: {batch.dispatchedByName} ({batch.dispatchedByCode})
              </p>
            </div>

            <div>
              <span className="text-[10px] text-gray-400 font-sans uppercase font-semibold">{t('Destination Warehouse')}</span>
              <p className="font-semibold text-gray-800 mt-0.5 leading-normal">
                {batch.toDistrictName ? `${batch.toDistrictName}, ` : ''}{batch.toStateName}
              </p>
              {batch.receivedByName && (
                <p className="text-[10px] text-gray-500 font-sans mt-0.5">
                  {t('Received by')}: {batch.receivedByName}
                </p>
              )}
            </div>

            <div>
              <span className="text-[10px] text-gray-400 font-sans uppercase font-semibold">{t('Timeline Details')}</span>
              <div className="space-y-2 mt-1.5">
                <div className="flex items-center gap-1.5 text-gray-600 font-sans">
                  <Calendar size={13} className="text-gray-400 shrink-0" />
                  <span>{t('Sent')}: {batch.dispatchDate ? format(new Date(batch.dispatchDate), 'dd MMM yyyy HH:mm') : '—'}</span>
                </div>
                {batch.expectedArrival && (
                  <div className="flex items-center gap-1.5 text-gray-600 font-sans">
                    <Calendar size={13} className="text-gray-400 shrink-0" />
                    <span>{t('Expected')}: {format(new Date(batch.expectedArrival), 'dd MMM yyyy')}</span>
                  </div>
                )}
                {batch.actualArrival && (
                  <div className="flex items-center gap-1.5 text-emerald-700 font-sans">
                    <CheckCircle size={13} className="text-emerald-500 shrink-0" />
                    <span>{t('Arrival')}: {format(new Date(batch.actualArrival), 'dd MMM yyyy HH:mm')}</span>
                  </div>
                )}
              </div>
            </div>

            {batch.remarks && (
              <div className="pt-2 border-t border-gray-100">
                <span className="text-[10px] text-gray-400 font-sans uppercase font-semibold">{t('Custodian Remarks')}</span>
                <p className="text-gray-700 font-sans mt-1 italic leading-normal bg-gray-50 p-2 border rounded">
                  &ldquo;{batch.remarks}&rdquo;
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Dispatch Items list */}
        <div className="lg:col-span-2 bg-white border border-gray-200 border-t-4 border-t-navy-950 rounded-lg p-5 shadow-sm space-y-4">
          <div className="pb-2 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-xs font-bold font-sans text-navy-950 uppercase tracking-wide">
              {t('Dispatched Device Items List')} ({batch.totalUnits} {t('unit(s)')})
            </h3>
            <span className="text-[10px] text-gray-400 font-mono">{t('Challan Details')}</span>
          </div>

          <Table
            columns={columns}
            data={items}
            isLoading={false}
            emptyStateTitle={t('No Units Linked')}
            emptyStateDescription={t('This batch has no registered units. Check database integrity.')}
          />
        </div>
      </div>

      {/* Modal - Cancel Batch */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title={t('Cancel Shipment')}
        size="md"
      >
        <form onSubmit={handleCancelSubmit} className="space-y-4">
          <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800 text-[11px] font-sans flex gap-2">
            <AlertTriangle size={16} className="shrink-0 mt-0.5 text-red-500" />
            <div>
              <span className="font-bold">{t('Warning')}: </span>
              {t('Cancelling a shipment cannot be undone. All devices in this shipment will automatically return to the sender warehouse location.')}
            </div>
          </div>

          <Input
            label={t('Cancellation Reason / Audit notes')}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder={t('E.g. Security convoy rescheduled, typo in destination warehouse state, etc.')}
            maxLength={255}
            required
            autoFocus
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setCancelModalOpen(false)}
              className="cursor-pointer"
            >
              {t('Back')}
            </Button>
            <Button
              type="submit"
              variant="danger"
              className="cursor-pointer"
              loading={cancelBatchMutation.isPending}
            >
              {t('Abort & Cancel Shipping Batch')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Off-screen Print Component for Challan */}
      <div className="hidden">
        <div className="p-8">
          <DispatchChallan ref={challanRef} batch={batch} items={items} />
        </div>
      </div>
    </div>
  );
}
