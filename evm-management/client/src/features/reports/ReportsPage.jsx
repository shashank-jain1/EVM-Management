import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi, referenceApi } from '@/api/reports.api';
import Table from '@/components/common/Table';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import Spinner from '@/components/common/Spinner';
import Pagination from '@/components/common/Pagination';
import Select from '@/components/common/Select';
import { useAuthStore } from '@/store/authStore';
import { format } from 'date-fns';
import {
  FileSpreadsheet,
  Cpu,
  Truck,
  History,
  Grid
} from 'lucide-react';
import { useTranslation } from '@/components/common/LanguageContext';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('inventory');
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const [selectedState, setSelectedState] = useState(
    user?.role !== 'ADMIN' && user?.stateId ? String(user.stateId) : ''
  );
  const [selectedDistrict, setSelectedDistrict] = useState(
    user?.role === 'DISTRICT_OFFICER' && user?.districtId ? String(user.districtId) : ''
  );

  // States & Districts queries for filtering
  const statesQuery = useQuery({
    queryKey: ['states'],
    queryFn: async () => {
      const res = await referenceApi.getStates();
      return res.data.data;
    },
    enabled: activeTab === 'inventory',
  });

  const districtsQuery = useQuery({
    queryKey: ['districts', selectedState],
    queryFn: async () => {
      const res = await referenceApi.getDistricts(selectedState);
      return res.data.data;
    },
    enabled: activeTab === 'inventory' && !!selectedState,
  });
  
  // State variables for Dispatch tab pagination
  const [dispatchPage, setDispatchPage] = useState(1);
  const dispatchLimit = 10;
  
  // State variables for Timeline tab pagination
  const [timelinePage, setTimelinePage] = useState(1);
  const timelineLimit = 10;

  // 1. Fetch Inventory Summary Report
  const inventoryQuery = useQuery({
    queryKey: ['reportInventory', selectedState, selectedDistrict],
    queryFn: async () => {
      const res = await reportsApi.inventorySummary({
        stateId: selectedState || undefined,
        districtId: selectedDistrict || undefined,
      });
      return res.data.data; // Expect array of { stateName, districtName, totalUnits, controlUnits, ballotUnits, vvpatUnits }
    },
    enabled: activeTab === 'inventory',
  });

  // 2. Fetch Dispatch History Report (paginated)
  const dispatchHistoryQuery = useQuery({
    queryKey: ['reportDispatch', dispatchPage],
    queryFn: async () => {
      const res = await reportsApi.dispatchHistory({ page: dispatchPage, limit: dispatchLimit });
      return {
        items: res.data.data || [],
        totalPages: res.data.pagination?.totalPages || 1,
        totalItems: res.data.pagination?.total || 0
      };
    },
    enabled: activeTab === 'dispatch',
  });

  // 3. Fetch Movement Timeline Report (paginated)
  const movementQuery = useQuery({
    queryKey: ['reportMovement', timelinePage],
    queryFn: async () => {
      const res = await reportsApi.movementTimeline({ page: timelinePage, limit: timelineLimit });
      return {
        items: res.data.data || [],
        totalPages: res.data.pagination?.totalPages || 1,
        totalItems: res.data.pagination?.total || 0
      };
    },
    enabled: activeTab === 'timeline',
  });

  // Export to CSV helper
  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]);
    const rows = data.map((row) =>
      headers
        .map((header) => {
          let val = row[header];
          if (val === null || val === undefined) val = '';
          return `"${val.toString().replace(/"/g, '""')}"`;
        })
        .join(',')
    );

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── INVENTORY TAB ──
  const renderInventoryTab = () => {
    const columns = [
      { header: t('State Location'), accessor: 'stateName' },
      { header: t('District Location'), accessor: 'districtName', render: (val) => val || t('State Pool') },
      { header: t('Control Units (CU)'), accessor: 'controlUnits', render: (val) => <span className="font-mono text-xs font-semibold text-gray-800">{val}</span> },
      { header: t('Ballot Units (BU)'), accessor: 'ballotUnits', render: (val) => <span className="font-mono text-xs font-semibold text-gray-800">{val}</span> },
      { header: t('VVPATs'), accessor: 'vvpatUnits', render: (val) => <span className="font-mono text-xs font-semibold text-gray-800">{val}</span> },
      { header: t('Total Units'), accessor: 'totalUnits', render: (val) => <span className="font-mono text-xs font-extrabold text-navy-955">{val}</span> },
    ];

    const data = inventoryQuery.data || [];

    return (
      <div className="space-y-4">
        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4 border border-gray-200 rounded-lg bg-gray-50/50">
          <Select
            label={t('State')}
            value={selectedState}
            onChange={(val) => {
              setSelectedState(val);
              setSelectedDistrict('');
            }}
            options={(statesQuery.data || []).map((s) => ({ label: s.stateName ?? s.StateName, value: s.stateId != null ? String(s.stateId) : s.StateId != null ? String(s.StateId) : '' }))}
            isLoading={statesQuery.isLoading}
            placeholder={t('All States')}
            disabled={user?.role !== 'ADMIN'}
            searchable={true}
          />

          <Select
            label={t('District')}
            value={selectedDistrict}
            onChange={setSelectedDistrict}
            options={(districtsQuery.data || []).map((d) => ({ label: d.districtName ?? d.DistrictName, value: d.districtId != null ? String(d.districtId) : d.DistrictId != null ? String(d.DistrictId) : '' }))}
            disabled={!selectedState || user?.role === 'DISTRICT_OFFICER'}
            isLoading={districtsQuery.isLoading}
            placeholder={selectedState ? t('All Districts') : t('Select State First')}
            searchable={true}
          />

          <div className="flex items-end pb-0.5">
            <button
              onClick={() => {
                setSelectedState(user?.role !== 'ADMIN' && user?.stateId ? String(user.stateId) : '');
                setSelectedDistrict(user?.role === 'DISTRICT_OFFICER' && user?.districtId ? String(user.districtId) : '');
              }}
              className="h-9 px-4 text-xs font-bold text-gray-500 hover:text-saffron-600 transition-colors uppercase tracking-wider font-mono border border-gray-350 bg-white rounded-md w-full cursor-pointer hover:bg-gray-50"
            >
              {t('Reset Filters')}
            </button>
          </div>
        </div>

        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
          <h3 className="text-xs font-bold font-sans text-navy-900 uppercase tracking-wide flex items-center gap-1.5">
            <Grid size={15} className="text-gray-400" />
            {t('Inventory Location Summary Report')}
          </h3>
          <Button
            onClick={() => exportToCSV(data, 'ECI_Inventory_Summary')}
            disabled={data.length === 0}
            variant="secondary"
            size="sm"
            className="cursor-pointer text-xs h-8 border border-gray-250 bg-white"
          >
            <span className="flex items-center gap-1.5"><FileSpreadsheet size={13} /> {t('Export CSV')}</span>
          </Button>
        </div>

        <Table
          columns={columns}
          data={data}
          isLoading={inventoryQuery.isLoading}
          emptyStateTitle={t('No Inventory Summaries Found')}
          emptyStateDescription={t('Check if data has been registered or seeded in the database.')}
        />
      </div>
    );
  };

  // ── DISPATCH TAB ──
  const renderDispatchTab = () => {
    const columns = [
      { header: t('Batch Code'), accessor: 'batchCode', render: (val) => <span className="font-mono text-xs font-bold text-gray-900">{val}</span> },
      { header: t('Origin Location'), accessor: 'fromStateName', render: (val, row) => `${row.fromDistrictName ? `${row.fromDistrictName}, ` : ''}${val}` },
      { header: t('Destination'), accessor: 'toStateName', render: (val, row) => `${row.toDistrictName ? `${row.toDistrictName}, ` : ''}${val}` },
      { header: t('Units Quant'), accessor: 'totalUnits', render: (val) => <span className="font-mono font-semibold">{val}</span> },
      { header: t('Date Dispatched'), accessor: 'dispatchDate', render: (val) => val ? format(new Date(val), 'dd MMM yyyy') : '—' },
      { header: t('Expected Arrival'), accessor: 'expectedArrival', render: (val) => val ? format(new Date(val), 'dd MMM yyyy') : '—' },
      { header: t('Actual Arrival'), accessor: 'actualArrival', render: (val) => val ? format(new Date(val), 'dd MMM yyyy') : t('In Transit') },
      { header: t('Status'), accessor: 'dispatchStatus', render: (val) => <Badge status={val} /> },
    ];

    const data = dispatchHistoryQuery.data?.items || [];

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
          <h3 className="text-xs font-bold font-sans text-navy-900 uppercase tracking-wide flex items-center gap-1.5">
            <Truck size={15} className="text-gray-400" />
            {t('Shipment Dispatch History Logs')}
          </h3>
          <Button
            onClick={() => exportToCSV(data, 'ECI_Dispatch_History')}
            disabled={data.length === 0}
            variant="secondary"
            size="sm"
            className="cursor-pointer text-xs h-8 border border-gray-250 bg-white"
          >
            <span className="flex items-center gap-1.5"><FileSpreadsheet size={13} /> {t('Export CSV')}</span>
          </Button>
        </div>

        <Table
          columns={columns}
          data={data}
          isLoading={dispatchHistoryQuery.isLoading}
          emptyStateTitle={t('No Dispatch History Logs Found')}
        />

        {dispatchHistoryQuery.data?.totalPages > 1 && (
          <div className="flex justify-between items-center pt-4 border-t border-gray-100">
            <span className="text-xs text-gray-500 font-sans">
              {t('Showing page')} <span className="font-semibold">{dispatchPage}</span> {t('of')} {dispatchHistoryQuery.data.totalPages}
            </span>
            <Pagination
              page={dispatchPage}
              totalPages={dispatchHistoryQuery.data.totalPages}
              onPageChange={setDispatchPage}
            />
          </div>
        )}
      </div>
    );
  };

  // ── MOVEMENT TIMELINE TAB ──
  const renderTimelineTab = () => {
    const columns = [
      { header: t('Log Date'), accessor: 'actionDate', render: (val) => <span className="font-mono text-xs text-gray-500">{val ? format(new Date(val), 'dd MMM yy HH:mm') : '—'}</span> },
      { header: t('Unit Code'), accessor: 'unitCode', render: (val) => <span className="font-mono text-xs font-bold text-navy-900">{val}</span> },
      { header: t('Device Type'), accessor: 'unitType', render: (val) => <Badge status={val} /> },
      { header: t('Lifecycle Action'), accessor: 'actionType', render: (val) => <Badge status={val} /> },
      { header: t('From Location'), accessor: 'fromStateName', render: (val, row) => val ? `${row.fromDistrictName ? `${row.fromDistrictName}, ` : ''}${val}` : '—' },
      { header: t('To Location'), accessor: 'toStateName', render: (val, row) => val ? `${row.toDistrictName ? `${row.toDistrictName}, ` : ''}${val}` : '—' },
      { header: t('Triggered By'), accessor: 'actionByName', render: (val) => <span className="text-xs text-gray-700 font-semibold">{val || t('Officer')}</span> },
      { header: t('Remarks'), accessor: 'remarks', render: (val) => <span className="text-xs text-gray-500 italic max-w-[150px] truncate block">{val || '—'}</span> },
    ];

    const data = movementQuery.data?.items || [];

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
          <h3 className="text-xs font-bold font-sans text-navy-900 uppercase tracking-wide flex items-center gap-1.5">
            <History size={15} className="text-gray-400" />
            {t('Device Movement History Logs')}
          </h3>
          <Button
            onClick={() => exportToCSV(data, 'ECI_Movement_History')}
            disabled={data.length === 0}
            variant="secondary"
            size="sm"
            className="cursor-pointer text-xs h-8 border border-gray-250 bg-white"
          >
            <span className="flex items-center gap-1.5"><FileSpreadsheet size={13} /> {t('Export CSV')}</span>
          </Button>
        </div>

        <Table
          columns={columns}
          data={data}
          isLoading={movementQuery.isLoading}
          emptyStateTitle={t('No Movement Transaction Logs Recorded')}
        />

        {movementQuery.data?.totalPages > 1 && (
          <div className="flex justify-between items-center pt-4 border-t border-gray-100">
            <span className="text-xs text-gray-500 font-sans">
              {t('Showing page')} <span className="font-semibold">{timelinePage}</span> {t('of')} {movementQuery.data.totalPages}
            </span>
            <Pagination
              page={timelinePage}
              totalPages={movementQuery.data.totalPages}
              onPageChange={setTimelinePage}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-gray-200 p-4 rounded-lg shadow-sm">
        <div>
          <h2 className="text-base font-bold font-sans text-navy-900 leading-tight">
            {t('Reports & Analytics Portal')}
          </h2>
          <p className="text-xs text-gray-500 font-sans mt-0.5">
            {t('Audit inventory records, tracking histories, and transaction logs.')}
          </p>
        </div>
      </div>

      {/* Tabs list */}
      <div className="border-b border-gray-200 bg-white p-1 rounded-lg flex gap-1 shadow-sm max-w-xl">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded transition-colors cursor-pointer select-none ${
            activeTab === 'inventory'
              ? 'bg-navy-950 text-white'
              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
          }`}
        >
          <Cpu size={14} /> {t('Inventory Location')}
        </button>

        <button
          onClick={() => setActiveTab('dispatch')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded transition-colors cursor-pointer select-none ${
            activeTab === 'dispatch'
              ? 'bg-navy-950 text-white'
              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
          }`}
        >
          <Truck size={14} /> {t('Dispatch History')}
        </button>

        <button
          onClick={() => setActiveTab('timeline')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded transition-colors cursor-pointer select-none ${
            activeTab === 'timeline'
              ? 'bg-navy-950 text-white'
              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
          }`}
        >
          <History size={14} /> {t('Movement Timeline')}
        </button>
      </div>

      {/* Tab Panels */}
      <div className="bg-white border border-gray-200 border-t-4 border-t-navy-950 rounded-lg p-5 shadow-sm">
        {activeTab === 'inventory' && renderInventoryTab()}
        {activeTab === 'dispatch' && renderDispatchTab()}
        {activeTab === 'timeline' && renderTimelineTab()}
      </div>
    </div>
  );
}
