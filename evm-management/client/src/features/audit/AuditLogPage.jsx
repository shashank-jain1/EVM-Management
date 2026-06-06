import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/api/reports.api';
import Table from '@/components/common/Table';
import Button from '@/components/common/Button';
import Select from '@/components/common/Select';
import SearchInput from '@/components/common/SearchInput';
import Pagination from '@/components/common/Pagination';
import Modal from '@/components/common/Modal';
import { SlidersHorizontal, RefreshCw, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslation } from '@/components/common/LanguageContext';

export default function AuditLogPage() {
  const [search, setSearch] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;
  const { t } = useTranslation();

  // Modal detail state
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [activeLog, setActiveLog] = useState(null);

  const formatJsonValue = (val, fallback) => {
    if (!val) return fallback;
    try {
      const parsed = JSON.parse(val);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return val;
    }
  };

  // 1. Fetch Audit Logs
  const auditLogsQuery = useQuery({
    queryKey: ['auditLogs', search, selectedAction, page],
    queryFn: async () => {
      const res = await reportsApi.auditLogs({
        search,
        action: selectedAction || undefined,
        page,
        limit,
      });
      return {
        items: res.data.data || [],
        totalItems: res.data.pagination?.total || 0,
        totalPages: res.data.pagination?.totalPages || 0,
      };
    },
  });

  const handleSearch = (val) => {
    setSearch(val);
    setPage(1);
  };

  const handleActionChange = (val) => {
    setSelectedAction(val);
    setPage(1);
  };

  const resetFilters = () => {
    setSearch('');
    setSelectedAction('');
    setPage(1);
  };

  const triggerDetailModal = (log) => {
    setActiveLog(log);
    setDetailModalOpen(true);
  };

  const actionOptions = [
    { label: t('Login Attempt'), value: 'LOGIN' },
    { label: t('Logout'), value: 'LOGOUT' },
    { label: t('Register EVM'), value: 'REGISTER_EVM' },
    { label: t('Dispatch Batch'), value: 'DISPATCH_BATCH' },
    { label: t('Receive Batch'), value: 'RECEIVE_BATCH' },
    { label: t('Create User'), value: 'CREATE_USER' },
    { label: t('Deactivate User'), value: 'DEACTIVATE_USER' },
  ];

  const columns = [
    {
      header: t('Timestamp'),
      accessor: 'createdAt',
      render: (val) => (
        <span className="font-mono text-xs text-gray-500">
          {val ? format(new Date(val), 'dd MMM yyyy HH:mm:ss') : '—'}
        </span>
      ),
    },
    {
      header: t('Performed By'),
      accessor: 'userCode',
      render: (val, row) => (
        <span className="text-xs text-gray-700 font-semibold font-sans">
          {row.fullName || t('System')} ({val || 'SYS'})
        </span>
      ),
    },
    {
      header: t('Security Action'),
      accessor: 'action',
      render: (val) => (
        <span className="text-xs font-mono font-bold text-navy-950 uppercase bg-navy-50 border px-1.5 py-0.5 rounded">
          {t(val)}
        </span>
      ),
    },
    {
      header: t('Entity Impacted'),
      accessor: 'entityType',
      render: (val, row) => (
        <span className="text-xs text-gray-600 font-mono">
          {val ? `${t(val)} (${row.entityId})` : '—'}
        </span>
      ),
    },
    {
      header: t('IP Address'),
      accessor: 'ipAddress',
      render: (val) => <span className="font-mono text-[11px] text-gray-500">{val || 'localhost'}</span>,
    },
    {
      header: t('Inspect Payload'),
      accessor: 'logId',
      render: (val, row) => (
        <Button
          onClick={() => triggerDetailModal(row)}
          variant="ghost"
          size="sm"
          className="text-gray-500 hover:text-navy-900 h-9 w-9 p-0 flex items-center justify-center cursor-pointer"
          title={t('Inspect Activity Log Details')}
        >
          <Eye size={20} />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-gray-200 p-4 rounded-lg shadow-sm">
        <div>
          <h2 className="text-base font-bold font-sans text-navy-900 leading-tight">
            {t('System Activity Logs')}
          </h2>
          <p className="text-xs text-gray-500 font-sans mt-0.5">
            {t('Immutable log of all user logins, credential changes, registry modifications, and dispatches.')}
          </p>
        </div>
        <button
          onClick={() => auditLogsQuery.refetch()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded transition-colors cursor-pointer self-stretch sm:self-auto justify-center"
        >
          <RefreshCw size={12} /> {t('Sync Log Files')}
        </button>
      </div>

      {/* Filter panel */}
      <div className="bg-white border border-gray-200 border-t-4 border-t-saffron-500 rounded-lg p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2 text-xs font-bold font-sans text-navy-900 uppercase tracking-wide">
            <SlidersHorizontal size={14} className="text-gray-400" />
            {t('Filter Logs')}
          </div>
          <button
            onClick={resetFilters}
            className="text-[10px] font-bold text-gray-400 hover:text-saffron-500 transition-colors uppercase tracking-wider font-mono"
          >
            {t('Reset Filters')}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">{t('Search Logs')}</label>
            <SearchInput
              value={search}
              onSearch={handleSearch}
              placeholder={t('Search Performed By (User ID/Name) or Entity ID...')}
              className="w-full text-xs"
            />
          </div>

          <Select
            label={t('Log Action Type')}
            value={selectedAction}
            onChange={handleActionChange}
            options={actionOptions}
            placeholder={t('All Log Actions')}
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-gray-200 border-t-4 border-t-navy-950 rounded-lg p-5 shadow-sm space-y-4">
        <Table
          columns={columns}
          data={auditLogsQuery.data?.items || []}
          isLoading={auditLogsQuery.isLoading}
          emptyStateTitle={t('No Audit Logs Found')}
          emptyStateDescription={t('Try resetting your filters or checks systems connections.')}
        />

        {auditLogsQuery.data?.totalPages > 1 && (
          <div className="flex justify-between items-center pt-4 border-t border-gray-100">
            <span className="text-xs text-gray-500 font-sans">
              {t('Showing page')} <span className="font-semibold text-gray-700">{page}</span> {t('of')}{' '}
              <span className="font-semibold text-gray-700">{auditLogsQuery.data.totalPages}</span> ({auditLogsQuery.data.totalItems} {t('total logs')})
            </span>
            <Pagination
              page={page}
              totalPages={auditLogsQuery.data.totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {/* Detail Modal - Old vs New values inspect */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setActiveLog(null);
        }}
        title={t('Inspect Activity Log Details')}
        size="lg"
      >
        {activeLog && (
          <div className="space-y-4 text-xs font-sans">
            <div className="p-3 bg-navy-950 text-white rounded font-mono text-[11px] space-y-1.5 border">
              <div><span className="text-gray-400">{t('Security Action')}:</span> <span className="text-saffron-400 font-bold">{t(activeLog.action)}</span></div>
              <div><span className="text-gray-400">{t('Timestamp')}:</span> {activeLog.createdAt ? format(new Date(activeLog.createdAt), 'dd MMM yyyy HH:mm:ss') : '—'}</div>
              <div><span className="text-gray-400">{t('Performed By')}:</span> {activeLog.fullName} ({activeLog.userCode})</div>
              <div><span className="text-gray-400">BROWSER:</span> <span className="text-gray-300 text-[10px] break-all">{activeLog.userAgent || 'system agents'}</span></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] text-gray-400 font-sans uppercase font-bold block mb-1.5">{t('Original State (Old Values)')}</span>
                <pre className="p-3 bg-gray-50 border border-gray-200 rounded font-mono text-[10.5px] text-gray-700 overflow-auto max-h-56 leading-normal whitespace-pre-wrap break-all">
                  {formatJsonValue(activeLog.oldValues, t('No original values captured (Create action)'))}
                </pre>
              </div>

              <div>
                <span className="text-[10px] text-gray-400 font-sans uppercase font-bold block mb-1.5">{t('Modified State (New Values)')}</span>
                <pre className="p-3 bg-gray-50 border border-gray-200 rounded font-mono text-[10.5px] text-gray-700 overflow-auto max-h-56 leading-normal whitespace-pre-wrap break-all">
                  {formatJsonValue(activeLog.newValues, t('No replacement values captured (Delete action)'))}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <Button
                onClick={() => {
                  setDetailModalOpen(false);
                  setActiveLog(null);
                }}
                variant="secondary"
                className="cursor-pointer"
              >
                {t('Close Inspector')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
