import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardData } from './hooks/useDashboardData';
import KPICard from './components/KPICard';
import RecentDispatches from './components/RecentDispatches';
import PendingReceipts from './components/PendingReceipts';
import InventoryChart from './components/InventoryChart';
import Button from '@/components/common/Button';
import Spinner from '@/components/common/Spinner';
import { Cpu, Truck, Download, ShieldAlert, PlusCircle, BarChart3, RefreshCw, Search } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from '@/components/common/LanguageContext';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const {
    kpis,
    districtBreakdown,
    recentDispatches,
    pendingReceipts,
    isLoading,
    isError,
    error,
    refetchAll,
  } = useDashboardData();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <Spinner size="xl" label={t("Synchronizing systems...")} />
        <p className="text-xs text-gray-500 font-sans animate-pulse">{t("Loading EVM database...")}</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-6 bg-white border border-gray-200 rounded-lg max-w-lg mx-auto shadow-sm">
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-4 border border-red-100">
          <ShieldAlert size={24} />
        </div>
        <h3 className="text-base font-bold text-gray-900 font-sans">{t("System Sync Failure")}</h3>
        <p className="text-xs text-gray-500 font-sans mt-2 max-w-sm">
          {t("Failed to fetch database information. Ensure the backend server is running and database schema is seeded.")}
        </p>
        <div className="mt-6 flex gap-3">
          <Button onClick={refetchAll} variant="primary" className="cursor-pointer">
            <span className="flex items-center gap-1.5 justify-center">
              <RefreshCw size={14} /> {t("Retry Sync")}
            </span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome & Top Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-gray-200 p-4 rounded-lg shadow-sm">
        <div>
          <h2 className="text-base font-bold font-sans text-navy-900 leading-tight">
            {t("System Dashboard")}
          </h2>
          <p className="text-xs text-gray-500 font-sans mt-0.5">
            {t("Logged in as")} <span className="font-semibold text-gray-700">{user?.fullName}</span>
          </p>
        </div>
      </div>

      {/* Pending Receipts Alert for state/district officers */}
      <PendingReceipts receipts={pendingReceipts} />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <KPICard
          title={t("Total EVMs")}
          value={kpis.totalUnits}
          detail={
            <span className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 font-bold text-[11px] border border-sky-200">
                CU: {kpis.controlUnits}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-violet-100 text-violet-800 font-bold text-[11px] border border-violet-200">
                BU: {kpis.ballotUnits}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-pink-100 text-pink-800 font-bold text-[11px] border border-pink-200">
                DMM: {kpis.dmmUnits}
              </span>
            </span>
          }
          icon={Cpu}
          className="border-t-4 border-t-blue-500"
        />
        <KPICard
          title={t("Sent EVMs")}
          value={kpis.sentUnits}
          detail={t("Total units sent across locations")}
          icon={Truck}
          className="border-t-4 border-t-saffron-500"
        />
        <KPICard
          title={t("Received EVMs")}
          value={kpis.receivedUnits}
          detail={t("Total units successfully received")}
          icon={Download}
          className="border-t-4 border-t-emerald-500"
        />
        <div
          onClick={() => navigate('/search')}
          className="bg-white/80 backdrop-blur-md border border-slate-200/50 rounded-2xl p-3.5 md:p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-purple-500/20 transition-all duration-300 relative group overflow-hidden select-none cursor-pointer border-t-4 border-t-purple-500"
        >
          <div className="absolute top-0 inset-x-0 h-[3px] bg-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
          <div className="flex justify-between items-start">
            <div className="min-w-0">
              <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider font-sans block truncate">
                {t("Global Search")}
              </span>
              <h3 className="text-[13px] md:text-base font-bold text-purple-600 mt-1 md:mt-2.5 leading-tight">
                {t("Search database")}
              </h3>
            </div>
            <div className="p-2 md:p-2.5 rounded-xl bg-purple-50 border border-purple-100/50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white group-hover:border-purple-600 transition-all duration-300 shrink-0">
              <Search size={18} className="stroke-[1.5] md:w-5 md:h-5" />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-3 md:mt-4 pt-2.5 md:pt-3 border-t border-slate-200/50 text-[10px] md:text-xs gap-1">
            <span className="text-slate-450 font-sans truncate pr-2">
              {t("Search barcode, serial, or batch")}
            </span>
            <span className="font-bold font-sans shrink-0 px-1.5 py-0.5 rounded-md text-[9px] md:text-[10px] self-start sm:self-auto uppercase tracking-wide bg-purple-50 text-purple-700 border border-purple-200">
              {t("Search")}
            </span>
          </div>
        </div>
      </div>

      {/* Recharts Analytics */}
      <InventoryChart data={districtBreakdown} />

      {/* Recent Dispatches table */}
      <RecentDispatches dispatches={recentDispatches} />
    </div>
  );
}
