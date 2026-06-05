import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dispatchApi } from '@/api/dispatch.api';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import Spinner from '@/components/common/Spinner';
import EmptyState from '@/components/common/EmptyState';
import ReceiveBatchModal from './components/ReceiveBatchModal';
import { useToast } from '@/components/common/Toast';
import { Download, RefreshCw, Package } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/components/common/LanguageContext';

export default function ReceivePage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { t } = useTranslation();
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // 1. Fetch pending dispatches destined for the user's location
  const pendingQuery = useQuery({
    queryKey: ['pendingReceipts'],
    queryFn: async () => {
      const res = await dispatchApi.getPending();
      return res.data.data; // array of pending batches with items
    },
    refetchInterval: 15000, // Poll every 15s for incoming shipments
  });

  const handleOpenReceiveModal = (batch) => {
    setSelectedBatch(batch);
    setModalOpen(true);
  };

  const handleCloseReceiveModal = () => {
    setSelectedBatch(null);
    setModalOpen(false);
  };

  if (pendingQuery.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3">
        <Spinner size="lg" />
        <p className="text-xs text-gray-500 font-sans">{t('Connecting to EVM database...')}</p>
      </div>
    );
  }

  const pendingBatches = pendingQuery.data || [];

  return (
    <div className="space-y-6">
      {/* Title bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-gray-200 p-4 rounded-lg shadow-sm">
        <div>
          <h2 className="text-base font-bold font-sans text-navy-900 leading-tight">
            {t('Receive EVM Units')}
          </h2>
          <p className="text-xs text-gray-500 font-sans mt-0.5">
            {t('Inspect and confirm EVM units sent to your location.')}
          </p>
        </div>
        <button
          onClick={() => pendingQuery.refetch()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded transition-colors cursor-pointer self-stretch sm:self-auto justify-center"
        >
          <RefreshCw size={12} /> {t('Refresh List')}
        </button>
      </div>

      {/* Main body */}
      {pendingBatches.length === 0 ? (
        <div className="bg-white border border-gray-250 border-t-4 border-t-navy-950 rounded-lg p-10 shadow-sm">
          <EmptyState
            title={t('All Shipments Received')}
            description={t('There are no pending shipments for your location.')}
            ctaLabel={t('Go to Dashboard')}
            onCta={() => navigate('/dashboard')}
            icon={Package}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pendingBatches.map((batch) => {
            const dateStr = batch.dispatchDate ? format(new Date(batch.dispatchDate), 'dd MMM yyyy') : '—';
            const expectedStr = batch.expectedArrival ? format(new Date(batch.expectedArrival), 'dd MMM yyyy') : '—';
            return (
              <div
                key={batch.batchId}
                className="bg-white border border-gray-200 border-l-4 border-l-saffron-500 hover:border-saffron-400 rounded-lg p-5 shadow-sm transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-3 pb-3 border-b border-gray-100">
                    <span className="font-mono text-xs font-bold text-navy-955 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                      {batch.batchCode}
                    </span>
                    <Badge status={batch.dispatchStatus} />
                  </div>

                  <div className="space-y-3 mt-4 text-xs font-sans text-gray-600">
                    <div className="flex justify-between items-start">
                      <span className="text-gray-400">{t('Shipping Origin')}:</span>
                      <span className="font-semibold text-gray-800 text-right">
                        {batch.fromDistrictName ? `${batch.fromDistrictName}, ` : ''}{batch.fromStateName}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">{t('Sent Date')}:</span>
                      <span className="text-gray-700">{dateStr}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">{t('Expected Arrival')}:</span>
                      <span className="text-gray-700 font-semibold">{expectedStr}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">{t('Total Units')}:</span>
                      <span className="font-mono font-bold text-navy-950 bg-gray-50 border px-1.5 py-0.5 rounded text-[10px]">
                        {batch.totalUnits} {t('Units')}
                      </span>
                    </div>

                    {batch.remarks && (
                      <div className="pt-2 mt-2 border-t border-gray-50 text-gray-500 italic">
                        &ldquo;{batch.remarks}&rdquo;
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 flex gap-2">
                  <Button
                    onClick={() => handleOpenReceiveModal(batch)}
                    variant="primary"
                    className="flex-1 text-xs font-bold shadow-sm cursor-pointer h-9"
                  >
                    <span className="flex items-center gap-1.5 justify-center">
                      <Download size={14} /> {t('Receive Batch')}
                    </span>
                  </Button>
                  
                  <Button
                    onClick={() => navigate(`/dispatch/${batch.batchId}`)}
                    variant="secondary"
                    className="bg-white border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-bold cursor-pointer h-9 px-3 shrink-0"
                    title={t('View Challan')}
                  >
                    {t('Details')}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Receive Modal overlay */}
      {selectedBatch && (
        <ReceiveBatchModal
          isOpen={modalOpen}
          onClose={handleCloseReceiveModal}
          batch={selectedBatch}
        />
      )}
    </div>
  );
}
