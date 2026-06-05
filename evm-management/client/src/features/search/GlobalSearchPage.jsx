import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/api/reports.api';
import SearchInput from '@/components/common/SearchInput';
import Spinner from '@/components/common/Spinner';
import Badge from '@/components/common/Badge';
import { Cpu, Truck, Search, ShieldAlert, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslation } from '@/components/common/LanguageContext';

export default function GlobalSearchPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [query, setQuery] = useState('');

  // 1. Unified search query (only triggers if query is 3+ chars)
  const searchQuery = useQuery({
    queryKey: ['globalSearch', query],
    queryFn: async () => {
      const res = await reportsApi.globalSearch(query);
      const flatList = res.data.data || [];
      const evmUnits = flatList
        .filter((item) => (item.resultType ?? item.ResultType) === 'EVM_UNIT')
        .map((item) => ({
          unitId: item.id ?? item.Id,
          unitCode: item.code ?? item.Code,
          unitType: item.subtype ?? item.Subtype,
          currentStatus: item.status ?? item.Status,
          stateName: item.stateName ?? item.StateName,
          districtName: item.districtName ?? item.DistrictName,
          serialNumber: item.extra ?? item.Extra,
        }));
      const dispatchBatches = flatList
        .filter((item) => (item.resultType ?? item.ResultType) === 'DISPATCH_BATCH')
        .map((item) => ({
          batchId: item.id ?? item.Id,
          batchCode: item.code ?? item.Code,
          dispatchStatus: item.subtype ?? item.Subtype,
          totalUnits: parseInt(item.extra ?? item.Extra) || 0,
          fromDistrictName: item.stateName ?? item.StateName,
          toDistrictName: item.districtName ?? item.DistrictName,
        }));
      return { evmUnits, dispatchBatches };
    },
    enabled: query.length >= 3,
  });

  const handleSearch = (val) => {
    setQuery(val);
  };

  const results = searchQuery.data || { evmUnits: [], dispatchBatches: [] };
  const totalResults = results.evmUnits.length + results.dispatchBatches.length;
  const showResults = query.length >= 3;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Search Input Card */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-4">
        <div className="text-center max-w-md mx-auto mb-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-saffron-50 text-saffron-500 mb-2 border border-saffron-100">
            <Search size={22} className="stroke-[1.5]" />
          </div>
          <h3 className="text-sm font-bold font-sans text-navy-955 uppercase tracking-wide">
            {t('Global Database Lookup')}
          </h3>
          <p className="text-[11px] text-gray-500 font-sans mt-1 leading-normal">
            {t('Query across the unified registry: look up device unit barcodes, manufacturer serial stamps, or logistics dispatch batch codes.')}
          </p>
        </div>

        <SearchInput
          value={query}
          onSearch={handleSearch}
          placeholder={t('Enter 3+ characters to search unit codes, serials, batch codes...')}
          className="w-full text-sm py-2.5 h-11"
        />
      </div>

      {/* Results Display */}
      {showResults && (
          <div className="space-y-6">
            {searchQuery.isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 bg-white border rounded-lg shadow-sm">
                <Spinner size="md" />
                <p className="text-xs text-gray-500 font-sans">{t('Querying ECI directories...')}</p>
              </div>
            ) : searchQuery.isError ? (
              <div className="p-5 text-center bg-white border border-gray-200 rounded-lg text-red-500 text-xs flex flex-col items-center justify-center gap-2 shadow-sm">
                <ShieldAlert size={24} className="text-red-500 animate-pulse" />
                <span className="font-bold">{t('Lookup Error')}</span>
                <p className="text-gray-500 text-[11px] max-w-xs mt-1">
                  {t('Failed to perform global search queries. Verify if search API services are fully operational.')}
                </p>
              </div>
            ) : totalResults === 0 ? (
              <div className="bg-white border border-gray-200 rounded-lg p-10 text-center text-gray-400 select-none shadow-sm">
                <p className="text-xs font-bold font-sans">{t('No Records Found')}</p>
                <p className="text-[10px] text-gray-500 font-sans mt-1">
                  {t('No matching registries found for query')} &ldquo;<span className="font-mono text-gray-700 font-bold">{query}</span>&rdquo;. {t('Check spelling or prefix identifiers.')}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Categorized sections: EVM UNITS */}
                {results.evmUnits.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm space-y-4">
                    <h4 className="text-xs font-bold font-sans text-navy-950 uppercase tracking-wide pb-2 border-b border-gray-100 flex items-center gap-2">
                      <Cpu size={14} className="text-gray-400" />
                      {t('Matching EVM Device Units')} ({results.evmUnits.length})
                    </h4>

                    <div className="divide-y divide-gray-150">
                      {results.evmUnits.map((unit) => (
                        <div
                          key={unit.unitId}
                          onClick={() => navigate(`/evm/${unit.unitId}`)}
                          className="py-3 flex justify-between items-center hover:bg-gray-50/50 cursor-pointer transition-colors px-1 rounded gap-4"
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-xs font-bold text-saffron-500">
                                {unit.unitCode}
                              </span>
                              <Badge status={unit.unitType} />
                              <Badge status={unit.currentStatus} />
                            </div>
                            <p className="text-[11px] text-gray-500 font-sans mt-1">
                              {t('Serial:')} <span className="font-mono font-bold text-gray-600">{unit.serialNumber}</span> &bull;{' '}
                              {t('Custody:')} {unit.districtName ? `${unit.districtName}, ` : ''}{unit.stateName}
                            </p>
                          </div>
                          <ArrowRight size={14} className="text-gray-300 shrink-0" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Categorized sections: DISPATCH BATCHES */}
                {results.dispatchBatches.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm space-y-4">
                    <h4 className="text-xs font-bold font-sans text-navy-950 uppercase tracking-wide pb-2 border-b border-gray-100 flex items-center gap-2">
                      <Truck size={14} className="text-gray-400" />
                      {t('Matching Dispatch Batches')} ({results.dispatchBatches.length})
                    </h4>

                    <div className="divide-y divide-gray-150">
                      {results.dispatchBatches.map((batch) => (
                        <div
                          key={batch.batchId}
                          onClick={() => navigate(`/dispatch/${batch.batchId}`)}
                          className="py-3 flex justify-between items-center hover:bg-gray-50/50 cursor-pointer transition-colors px-1 rounded gap-4"
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-xs font-bold text-saffron-500">
                                {batch.batchCode}
                              </span>
                              <Badge status={batch.dispatchStatus} />
                              <span className="font-mono text-[10px] font-bold text-gray-400 uppercase bg-gray-50 border px-1.5 py-0.2 rounded shrink-0">
                                {batch.totalUnits} {t('Units')}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-500 font-sans mt-1">
                              {t('Flow:')} {batch.fromDistrictName || t('State Pool')} &rarr; {batch.toDistrictName || t('State Pool')} &bull;{' '}
                              {t('Sent:')} {batch.dispatchDate ? format(new Date(batch.dispatchDate), 'dd MMM yyyy') : '—'}
                            </p>
                          </div>
                          <ArrowRight size={14} className="text-gray-300 shrink-0" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
      )}
    </div>
  );
}
