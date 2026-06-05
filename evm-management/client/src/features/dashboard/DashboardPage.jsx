import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardData } from './hooks/useDashboardData';
import KPICard from './components/KPICard';
import RecentDispatches from './components/RecentDispatches';
import PendingReceipts from './components/PendingReceipts';
import InventoryChart from './components/InventoryChart';
import StatusDonut from './components/StatusDonut';
import Button from '@/components/common/Button';
import Spinner from '@/components/common/Spinner';
import { Cpu, Truck, Download, ShieldAlert, PlusCircle, BarChart3, RefreshCw } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from '@/components/common/LanguageContext';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const {
    kpis,
    statusBreakdown,
    stateBreakdown,
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
            {t("Logged in as")} <span className="font-semibold text-gray-700">{user?.fullName}</span> (ID: <span className="font-mono text-[11px] font-bold text-saffron-600">{user?.userCode}</span>)
          </p>
        </div>
        <button
          onClick={refetchAll}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded transition-colors cursor-pointer"
        >
          <RefreshCw size={12} /> {t("Sync Data")}
        </button>
      </div>

      {/* Pending Receipts Alert for state/district officers */}
      <PendingReceipts receipts={pendingReceipts} />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <KPICard
          title={t("Total EVM Units")}
          value={kpis.totalUnits}
          detail={`${t("CU")}: ${kpis.controlUnits} | ${t("BU")}: ${kpis.ballotUnits} | ${t("VVPAT")}: ${kpis.vvpatUnits}`}
          icon={Cpu}
          className="border-t-4 border-t-blue-500"
        />
        <KPICard
          title={t("In Transit")}
          value={kpis.inTransit}
          detail={t("Currently moving between locations")}
          icon={Truck}
          trend={kpis.inTransit > 0 ? `${kpis.inTransit} ${t("moving")}` : t("No movements")}
          trendType={kpis.inTransit > 0 ? 'down' : 'neutral'}
          className="border-t-4 border-t-saffron-500"
        />
        <KPICard
          title={t("Deployed Units")}
          value={kpis.deployed}
          detail={t("Installed at active polling booths")}
          icon={BarChart3}
          trend={t("Active booths")}
          trendType="up"
          className="border-t-4 border-t-emerald-500"
        />
        <KPICard
          title={t("Faulty / Repair")}
          value={kpis.faulty}
          detail={t("Reported damaged/faulty units")}
          icon={ShieldAlert}
          trend={kpis.faulty > 0 ? `${kpis.faulty} ${t("flagged")}` : t("0 flagged")}
          trendType={kpis.faulty > 0 ? 'down' : 'up'}
          className="border-t-4 border-t-red-500"
        />
      </div>

      {/* Quick Action Operations */}
      <div className="bg-white border border-gray-200 border-t-4 border-t-saffron-500 rounded-lg p-5 shadow-sm">
        <h3 className="text-xs font-bold font-sans text-navy-955 uppercase tracking-wide mb-4 pb-1.5 border-b border-gray-100">
          {t("EVM Operations")}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50/50 border border-gray-200 hover:border-saffron-300 rounded flex flex-col justify-between transition-all group">
            <div>
              <h4 className="text-xs font-bold text-navy-950 font-sans">{t("Send EVM Batch")}</h4>
              <p className="text-[11px] text-gray-500 font-sans mt-1">
                {t("Send EVM units to another state or district warehouse.")}
              </p>
            </div>
            <Button
              onClick={() => navigate('/dispatch')}
              variant="primary"
              className="mt-4 w-full h-8 text-xs font-bold shadow-sm cursor-pointer"
            >
              <span className="flex items-center gap-1.5 justify-center">
                <PlusCircle size={14} /> {t("Send Batch")}
              </span>
            </Button>
          </div>

          <div className="p-4 bg-gray-50/50 border border-gray-200 hover:border-blue-300 rounded flex flex-col justify-between transition-all group">
            <div>
              <h4 className="text-xs font-bold text-navy-955 font-sans">{t("Receive Units")}</h4>
              <p className="text-[11px] text-gray-500 font-sans mt-1">
                {t("Scan and register EVM units sent to your location. Check conditions on arrival.")}
              </p>
            </div>
            <Button
              onClick={() => navigate('/receive')}
              variant="secondary"
              className="mt-4 w-full h-8 text-xs font-bold text-navy-900 border-navy-300 hover:bg-navy-50 cursor-pointer"
            >
              <span className="flex items-center gap-1.5 justify-center">
                <Download size={14} /> {t("Receive Units")}
              </span>
            </Button>
          </div>

          <div className="p-4 bg-gray-50/50 border border-gray-200 hover:border-gray-400 rounded flex flex-col justify-between transition-all group">
            <div>
              <h4 className="text-xs font-bold text-navy-955 font-sans">{t("EVM Inventory")}</h4>
              <p className="text-[11px] text-gray-500 font-sans mt-1">
                {t("View charts, search barcodes/QR codes, and view unit history.")}
              </p>
            </div>
            <Button
              onClick={() => navigate('/evm')}
              variant="secondary"
              className="mt-4 w-full h-8 text-xs font-bold text-gray-700 border-gray-300 hover:bg-gray-100 cursor-pointer"
            >
              <span className="flex items-center gap-1.5 justify-center">
                <Cpu size={14} /> {t("View Inventory")}
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* Recharts Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InventoryChart data={stateBreakdown} />
        <StatusDonut data={statusBreakdown} />
      </div>

      {/* Recent Dispatches table */}
      <RecentDispatches dispatches={recentDispatches} />
    </div>
  );
}
