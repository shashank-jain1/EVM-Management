import React from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { BellRing, ArrowRight, Calendar, Tag } from 'lucide-react';
import Button from '@/components/common/Button';
import { useTranslation } from '@/components/common/LanguageContext';

export default function PendingReceipts({ receipts }) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (!receipts || receipts.length === 0) return null;

  return (
    <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-5 mb-6 relative overflow-hidden select-none">
      <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2 bg-amber-100 border border-amber-200 text-amber-600 rounded shrink-0">
            <BellRing size={20} className="animate-bounce" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-amber-900 font-sans">
              {t('Pending Incoming Shipments')} ({receipts.length})
            </h4>
            <p className="text-xs text-amber-800 font-sans mt-0.5 max-w-xl">
              {t('There are')} {receipts.length} {t('batch(es) of EVM units currently in transit destined for your district or state. Review and process their receipt immediately upon physical arrival.')}
            </p>
          </div>
        </div>

        <Button
          onClick={() => navigate('/receive')}
          variant="secondary"
          className="bg-white hover:bg-amber-100/50 text-amber-900 border-amber-300 font-bold shrink-0 self-stretch md:self-auto cursor-pointer"
        >
          <span className="flex items-center gap-1.5 justify-center">
            {t('Go to Receipt Panel')} <ArrowRight size={14} />
          </span>
        </Button>
      </div>

      {/* Mini-list scroll of incoming batches */}
      <div className="mt-4 pt-3 border-t border-amber-200/60 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {receipts.slice(0, 3).map((batch) => (
          <div
            key={batch.batchId}
            className="bg-white border border-amber-150 p-3 rounded text-xs hover:border-amber-300 transition-colors shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono font-bold text-navy-950 text-[11px] bg-gray-50 border border-gray-200 px-1 py-0.5 rounded">
                  {batch.batchCode}
                </span>
                <span className="font-sans font-semibold text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded text-[10px] uppercase border border-gray-150">
                  {batch.totalUnits} {t('Units')}
                </span>
              </div>
              <p className="text-[11px] text-gray-600 font-sans mt-2">
                <span className="font-medium text-gray-500">{t('Origin')}: </span>
                {batch.fromDistrictName ? `${batch.fromDistrictName}, ${batch.fromStateName}` : batch.fromStateName}
              </p>
            </div>
            
            <div className="flex items-center gap-1.5 mt-3 text-[10px] text-gray-400 font-mono border-t border-gray-100 pt-2">
              <Calendar size={12} className="text-gray-400" />
              <span>{t('Sent')}: {batch.dispatchDate ? format(new Date(batch.dispatchDate), 'dd MMM yy') : '—'}</span>
            </div>
          </div>
        ))}
        {receipts.length > 3 && (
          <div
            onClick={() => navigate('/receive')}
            className="bg-amber-100/30 border border-dashed border-amber-300 p-3 rounded text-xs hover:bg-amber-100/50 transition-colors flex items-center justify-center cursor-pointer text-amber-700 font-bold font-sans"
          >
            {t('And')} {receipts.length - 3} {t('more. View All')} &rarr;
          </div>
        )}
      </div>
    </div>
  );
}
