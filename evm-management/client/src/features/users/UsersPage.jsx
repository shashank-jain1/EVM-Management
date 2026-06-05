import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { referenceApi } from '@/api/reports.api';
import { useUsers } from './hooks/useUsers';
import CreateUserModal from './components/CreateUserModal';
import EditUserModal from './components/EditUserModal';
import Table from '@/components/common/Table';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import Select from '@/components/common/Select';
import SearchInput from '@/components/common/SearchInput';
import Pagination from '@/components/common/Pagination';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { UserPlus, Edit2, ToggleLeft, ToggleRight, SlidersHorizontal, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslation } from '@/components/common/LanguageContext';

export default function UsersPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [toggleConfirmOpen, setToggleConfirmOpen] = useState(false);
  const [targetUser, setTargetUser] = useState(null);

  // States & Districts
  const statesQuery = useQuery({
    queryKey: ['states'],
    queryFn: async () => {
      const res = await referenceApi.getStates();
      return res.data.data;
    },
    staleTime: 300000,
  });

  const districtsQuery = useQuery({
    queryKey: ['districts', selectedState],
    queryFn: async () => {
      const res = await referenceApi.getDistricts(selectedState);
      return res.data.data;
    },
    enabled: !!selectedState,
    staleTime: 300000,
  });

  // Filter payload
  const filters = {
    search,
    role: selectedRole || undefined,
    stateId: selectedState ? parseInt(selectedState) : undefined,
    districtId: selectedDistrict ? parseInt(selectedDistrict) : undefined,
    userType: selectedType || undefined,
    isActive: selectedStatus === 'ACTIVE' ? true : selectedStatus === 'INACTIVE' ? false : undefined,
    page,
    limit,
  };

  const {
    users,
    totalPages,
    totalItems,
    isLoading,
    createUser,
    updateUser,
    toggleStatus,
    refetch,
  } = useUsers(filters);

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
    setSelectedRole('');
    setSelectedState('');
    setSelectedDistrict('');
    setSelectedType('');
    setSelectedStatus('');
    setPage(1);
  };

  const triggerToggleConfirm = (user) => {
    setTargetUser(user);
    setToggleConfirmOpen(true);
  };

  const handleToggleConfirm = async () => {
    if (targetUser) {
      await toggleStatus(targetUser.userId);
      setToggleConfirmOpen(false);
      setTargetUser(null);
    }
  };

  const triggerEditModal = (user) => {
    setTargetUser(user);
    setEditModalOpen(true);
  };

  const columns = [
    {
      header: t('User Code'),
      accessor: 'userCode',
      render: (val) => <span className="font-mono text-xs font-bold text-gray-800">{val}</span>,
    },
    {
      header: t('Full Name'),
      accessor: 'fullName',
      render: (val) => <span className="text-xs text-gray-700 font-semibold">{val}</span>,
    },
    {
      header: t('Role'),
      accessor: 'role',
      render: (val) => <Badge status={val} />,
    },
    {
      header: t('Jurisdiction'),
      accessor: 'stateName',
      render: (val, row) => (
        <span className="text-xs text-gray-600">
          {row.districtName ? `${row.districtName}, ${val || 'ECI'}` : val || t('Central Headquarters')}
        </span>
      ),
    },
    {
      header: t('Type'),
      accessor: 'userType',
      render: (val) => <Badge status={val} />,
    },
    {
      header: t('Account Status'),
      accessor: 'isActive',
      render: (val) => (
        <Badge status={val ? 'ACTIVE' : 'INACTIVE'} />
      ),
    },
    {
      header: t('Last Login'),
      accessor: 'lastLogin',
      render: (val) => (
        <span className="text-xs text-gray-500 font-mono">
          {val ? format(new Date(val), 'dd MMM yy HH:mm') : t('Never')}
        </span>
      ),
    },
    {
      header: t('Actions'),
      accessor: 'userId',
      render: (val, row) => (
        <div className="flex gap-2 items-center">
          <button
            type="button"
            onClick={() => triggerEditModal(row)}
            className="h-10 w-10 p-0 flex items-center justify-center text-gray-500 hover:text-navy-900 hover:bg-gray-100 rounded-md transition-all cursor-pointer"
          >
            <Edit2 size={20} />
          </button>

          <div className="flex items-center h-10 px-1">
            <button
              type="button"
              onClick={() => triggerToggleConfirm(row)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-navy-500 focus:ring-offset-2 ${
                row.isActive ? 'bg-emerald-500' : 'bg-gray-200'
              }`}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  row.isActive ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      ),
    },
  ];

  const roleOptions = [
    { label: t('State Officer'), value: 'STATE_OFFICER' },
    { label: t('District Officer'), value: 'DISTRICT_OFFICER' },
  ];

  const typeOptions = [
    { label: t('Permanent Account'), value: 'PERMANENT' },
    { label: t('Temporary Account'), value: 'TEMPORARY' },
  ];

  const statusOptions = [
    { label: t('Active Accounts'), value: 'ACTIVE' },
    { label: t('Deactivated Accounts'), value: 'INACTIVE' },
  ];

  return (
    <div className="space-y-6">
      {/* Title bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-gray-200 p-4 rounded-lg shadow-sm">
        <div>
          <h2 className="text-base font-bold font-sans text-navy-900 leading-tight">
            {t('User Management')}
          </h2>
          <p className="text-xs text-gray-500 font-sans mt-0.5">
            {t('Manage officer accounts and system access.')}
          </p>
        </div>
        
        <Button
          onClick={() => setCreateModalOpen(true)}
          variant="primary"
          className="shadow-sm shrink-0 cursor-pointer text-xs font-bold"
        >
          <span className="flex items-center gap-1.5 justify-center">
            <UserPlus size={15} /> {t('Create Officer Account')}
          </span>
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 border-t-4 border-t-saffron-500 rounded-lg p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2 text-xs font-bold font-sans text-navy-900 uppercase tracking-wide">
            <SlidersHorizontal size={14} className="text-gray-400" />
            {t('Filter Users')}
          </div>
          <button
            onClick={resetFilters}
            className="text-[10px] font-bold text-gray-400 hover:text-saffron-500 transition-colors uppercase tracking-wider font-mono"
          >
            {t('Reset Filters')}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="sm:col-span-2 flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">{t('Search Users')}</label>
            <SearchInput
              value={search}
              onSearch={handleSearch}
              placeholder={t('Search User ID or Name...')}
              className="w-full text-xs"
            />
          </div>

          <Select
            label={t('Role type')}
            value={selectedRole}
            onChange={handleFilterChange(setSelectedRole)}
            options={roleOptions}
            placeholder={t('All Roles')}
          />

          <Select
            label={t('State')}
            value={selectedState}
            onChange={handleStateChange}
            options={(statesQuery.data || []).map((s) => ({ label: s.stateName ?? s.StateName, value: s.stateId != null ? String(s.stateId) : s.StateId != null ? String(s.StateId) : '' }))}
            isLoading={statesQuery.isLoading}
            placeholder={t('All States')}
            searchable={true}
          />

          <Select
            label={t('District')}
            value={selectedDistrict}
            onChange={handleFilterChange(setSelectedDistrict)}
            options={(districtsQuery.data || []).map((d) => ({ label: d.districtName ?? d.DistrictName, value: d.districtId != null ? String(d.districtId) : d.DistrictId != null ? String(d.DistrictId) : '' }))}
            disabled={!selectedState}
            isLoading={districtsQuery.isLoading}
            placeholder={selectedState ? t('All Districts') : t('Select State First')}
            searchable={true}
          />

          <Select
            label={t('Account Status')}
            value={selectedStatus}
            onChange={handleFilterChange(setSelectedStatus)}
            options={statusOptions}
            placeholder={t('All Statuses')}
          />
        </div>
      </div>

      {/* Users table */}
      <div className="bg-white border border-gray-200 border-t-4 border-t-navy-950 rounded-lg p-5 shadow-sm space-y-4">
        <Table
          columns={columns}
          data={users}
          isLoading={isLoading}
          emptyStateTitle={t('No Officers Registered')}
          emptyStateDescription={t('Try resetting your filter parameters or checking connection.')}
        />

        {totalPages > 1 && (
          <div className="flex justify-between items-center pt-4 border-t border-gray-100">
            <span className="text-xs text-gray-500 font-sans">
              {t('Showing page')} <span className="font-semibold text-gray-700">{page}</span> {t('of')}{' '}
              <span className="font-semibold text-gray-700">{totalPages}</span> ({totalItems} {t('total accounts')})
            </span>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateUserModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreate={createUser}
      />

      {targetUser && (
        <EditUserModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setTargetUser(null);
          }}
          user={targetUser}
          onUpdate={updateUser}
        />
      )}

      <ConfirmDialog
        isOpen={toggleConfirmOpen}
        onClose={() => {
          setToggleConfirmOpen(false);
          setTargetUser(null);
        }}
        onConfirm={handleToggleConfirm}
        title={targetUser?.isActive ? t('Deactivate Officer Account?') : t('Activate Officer Account?')}
        message={`${t('Are you sure you want to')} ${
          targetUser?.isActive ? t('DEACTIVATE') : t('ACTIVATE')
        } ${t('account login ID:')} ${targetUser?.userCode}? ${t('All system credentials for this user will be')} ${
          targetUser?.isActive ? t('suspended immediately') : t('re-enabled')
        }.`}
      />
    </div>
  );
}
