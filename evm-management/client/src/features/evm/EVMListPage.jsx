import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { evmApi } from '@/api/evm.api';
import { referenceApi } from '@/api/reports.api'; // referenceApi is defined in reports.api.js
import { useAuthStore } from '@/store/authStore';
import Table from '@/components/common/Table';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import SearchInput from '@/components/common/SearchInput';
import Pagination from '@/components/common/Pagination';
import { PlusCircle, Eye, SlidersHorizontal, RefreshCw } from 'lucide-react';
import { useTranslation } from '@/components/common/LanguageContext';

export default function EVMListPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const canRegister = user?.role === 'ADMIN' || user?.role === 'STATE_OFFICER' || user?.role === 'DISTRICT_OFFICER';

  // State filters
  const [search, setSearch] = useState('');
  const [selectedState, setSelectedState] = useState(
    user?.role !== 'ADMIN' && user?.stateId ? String(user.stateId) : ''
  );
  const [selectedDistrict, setSelectedDistrict] = useState(
    user?.role === 'DISTRICT_OFFICER' && user?.districtId ? String(user.districtId) : ''
  );
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  // 1. Fetch States
  const statesQuery = useQuery({
    queryKey: ['states'],
    queryFn: async () => {
      const res = await referenceApi.getStates();
      return res.data.data; // array of { stateId, stateName, stateCode }
    },
    staleTime: 300000, // 5 min cache
  });

  // 2. Fetch Districts (conditional on state selection)
  const districtsQuery = useQuery({
    queryKey: ['districts', selectedState],
    queryFn: async () => {
      const res = await referenceApi.getDistricts(selectedState);
      return res.data.data; // array of { districtId, districtName, districtCode }
    },
    enabled: !!selectedState,
    staleTime: 300000,
  });

  // 3. Fetch EVM List
  const evmListQuery = useQuery({
    queryKey: ['evmList', search, selectedState, selectedDistrict, selectedType, selectedStatus, page],
    queryFn: async () => {
      const res = await evmApi.list({
        search,
        stateId: selectedState || undefined,
        districtId: selectedDistrict || undefined,
        unitType: selectedType || undefined,
        status: selectedStatus || undefined,
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

  const handleStateChange = (val) => {
    setSelectedState(val);
    setSelectedDistrict('');
    setPage(1);
  };

  const handleFilterChange = (setter) => (val) => {
    setter(val);
    setPage(1);
  };

  const handleSearch = (val) => {
    setSearch(val);
    setPage(1);
  };

  const resetFilters = () => {
    setSearch('');
    setSelectedState(user?.role !== 'ADMIN' && user?.stateId ? String(user.stateId) : '');
    setSelectedDistrict(user?.role === 'DISTRICT_OFFICER' && user?.districtId ? String(user.districtId) : '');
    setSelectedType('');
    setSelectedStatus('');
    setPage(1);
  };

  const unitTypeOptions = [
    { label: t('Control Unit (CU)'), value: 'CONTROL_UNIT' },
    { label: t('Ballot Unit (BU)'), value: 'BALLOT_UNIT' },
    { label: t('DMM'), value: 'DMM' },
  ];

  const statusOptions = [
    { label: t('In Warehouse'), value: 'IN_WAREHOUSE' },
    { label: t('Receiving pending'), value: 'IN_TRANSIT' },
  ];

  const columns = [
    {
      header: t('Unit Code'),
      accessor: 'unitCode',
      render: (val, row) => (
        <Link to={`/evm/${row.unitId}`} className="font-mono text-xs font-bold text-saffron-500 hover:underline">
          {val}
        </Link>
      ),
    },
    {
      header: t('Type'),
      accessor: 'unitType',
      render: (val) => <Badge status={val} />,
    },

    {
      header: t('Current Location'),
      accessor: 'stateName',
      render: (val, row) => (
        <span className="text-xs text-gray-600">
          {row.districtName ? `${row.districtName}, ${val || 'ECI'}` : val || t('ECI Headquarters')}
        </span>
      ),
    },
    {
      header: t('Status'),
      accessor: 'currentStatus',
      render: (val) => <Badge status={val} />,
    },
    {
      header: t('Actions'),
      accessor: 'unitId',
      render: (val) => (
        <button
          type="button"
          onClick={() => navigate(`/evm/${val}`)}
          className="h-10 w-10 p-0 flex items-center justify-center text-gray-500 hover:text-navy-900 hover:bg-gray-100 rounded-md transition-all cursor-pointer"
        >
          <Eye size={20} />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-gray-200 p-4 rounded-lg shadow-sm">
        <div>
          <h2 className="text-base font-bold font-sans text-navy-900 leading-tight">
            {t('EVM Inventory System')}
          </h2>
          <p className="text-xs text-gray-500 font-sans mt-0.5">
            {t('Full registry of all Electronic Voting Machine devices allocated across India.')}
          </p>
        </div>
        {canRegister && (
          <Button
            onClick={() => navigate('/evm/register')}
            variant="primary"
            className="shadow-sm cursor-pointer shrink-0"
          >
            <span className="flex items-center gap-1.5 justify-center">
              <PlusCircle size={15} /> {t('Register New EVM')}
            </span>
          </Button>
        )}
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-white border border-gray-200 border-t-4 border-t-saffron-500 rounded-lg p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2 text-xs font-bold font-sans text-navy-900 uppercase tracking-wide">
            <SlidersHorizontal size={14} className="text-gray-400" />
            {t('Filter Catalog')}
          </div>
          <button
            onClick={resetFilters}
            className="text-[10px] font-bold text-gray-400 hover:text-saffron-500 transition-colors uppercase tracking-wider font-mono"
          >
            {t('Reset Filters')}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {/* Global query search */}
          <div className="sm:col-span-2 lg:col-span-1 flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">{t('Search Inventory')}</label>
            <SearchInput
              value={search}
              onSearch={handleSearch}
              placeholder={t('Search Unit Code / Serial No...')}
              className="w-full text-xs"
            />
          </div>

          {/* State Dropdown */}
          <Select
            label={t('State')}
            value={selectedState}
            onChange={handleStateChange}
            options={(statesQuery.data || []).map((s) => ({ label: s.stateName ?? s.StateName, value: s.stateId != null ? String(s.stateId) : s.StateId != null ? String(s.StateId) : '' }))}
            isLoading={statesQuery.isLoading}
            placeholder={t('All States')}
            disabled={user?.role !== 'ADMIN'}
            searchable={true}
          />

          {/* District Dropdown */}
          <Select
            label={t('District')}
            value={selectedDistrict}
            onChange={handleFilterChange(setSelectedDistrict)}
            options={(districtsQuery.data || []).map((d) => ({ label: d.districtName ?? d.DistrictName, value: d.districtId != null ? String(d.districtId) : d.DistrictId != null ? String(d.DistrictId) : '' }))}
            disabled={!selectedState || user?.role === 'DISTRICT_OFFICER'}
            isLoading={districtsQuery.isLoading}
            placeholder={selectedState ? t('All Districts') : t('Select State First')}
            searchable={true}
          />

          {/* Unit Type Dropdown */}
          <Select
            label={t('Unit Type')}
            value={selectedType}
            onChange={handleFilterChange(setSelectedType)}
            options={unitTypeOptions}
            placeholder={t('All Types')}
          />

          {/* Status Dropdown */}
          <Select
            label={t('Status')}
            value={selectedStatus}
            onChange={handleFilterChange(setSelectedStatus)}
            options={statusOptions}
            placeholder={t('All Statuses')}
          />
        </div>
      </div>

      {/* Inventory table panel */}
      <div className="bg-white border border-gray-200 border-t-4 border-t-navy-950 rounded-lg p-5 shadow-sm space-y-4">
        <Table
          columns={columns}
          data={evmListQuery.data?.items || []}
          isLoading={evmListQuery.isLoading}
          emptyStateTitle={t('No EVM Units Found')}
          emptyStateDescription={t('Try tweaking your filter conditions, resetting, or verifying code format.')}
        />

        {/* Pagination controls */}
        {evmListQuery.data?.totalPages > 1 && (
          <div className="flex justify-between items-center pt-4 border-t border-gray-100">
            <span className="text-xs text-gray-500 font-sans">
              {t('Showing page')} <span className="font-semibold text-gray-700">{page}</span> {t('of')}{' '}
              <span className="font-semibold text-gray-700">{evmListQuery.data.totalPages}</span> ({evmListQuery.data.totalItems} {t('total units')})
            </span>
            <Pagination
              page={page}
              totalPages={evmListQuery.data.totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
