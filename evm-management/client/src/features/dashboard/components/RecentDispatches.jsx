import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import Table from '@/components/common/Table';
import Badge from '@/components/common/Badge';
import { useTranslation } from '@/components/common/LanguageContext';

export default function RecentDispatches({ dispatches }) {
  const { t } = useTranslation();

  const columns = [
    {
      header: t('Batch Code'),
      accessor: 'batchCode',
      render: (val, row) => (
        <Link to={`/dispatch/${row.batchId}`} className="font-mono text-xs text-saffron-500 hover:underline font-semibold">
          {val}
        </Link>
      ),
    },
    {
      header: t('From Location'),
      accessor: 'fromStateName',
      render: (val, row) => (
        <span className="text-xs text-gray-700">
          {row.fromDistrictName ? `${row.fromDistrictName}, ${val}` : val}
        </span>
      ),
    },
    {
      header: t('To Destination'),
      accessor: 'toStateName',
      render: (val, row) => (
        <span className="text-xs text-gray-700">
          {row.toDistrictName ? `${row.toDistrictName}, ${val}` : val}
        </span>
      ),
    },
    {
      header: t('Units'),
      accessor: 'totalUnits',
      render: (val) => <span className="font-mono text-xs font-bold text-gray-800">{val}</span>,
    },
    {
      header: t('Dispatch Date'),
      accessor: 'dispatchDate',
      render: (val) => (
        <span className="text-xs text-gray-500">
          {val ? format(new Date(val), 'dd MMM yyyy') : '—'}
        </span>
      ),
    },
    {
      header: t('Status'),
      accessor: 'dispatchStatus',
      render: (val) => <Badge status={val} />,
    },
  ];

  return (
    <div className="bg-white border border-gray-200 border-t-4 border-t-navy-950 rounded-lg p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
        <h3 className="text-sm font-bold font-sans text-navy-900 uppercase tracking-wide">
          {t('Recent Shipments Sent')}
        </h3>
        <Link
          to="/dispatch"
          className="text-xs font-semibold text-saffron-500 hover:text-saffron-600 font-sans transition-colors"
        >
          {t('View Logs')} &rarr;
        </Link>
      </div>

      <div className="overflow-x-auto">
        <Table
          columns={columns}
          data={dispatches}
          isLoading={false}
          className="min-w-full"
        />
      </div>
    </div>
  );
}
