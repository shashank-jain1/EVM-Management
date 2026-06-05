import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/api/reports.api';
import { dispatchApi } from '@/api/dispatch.api';
import { useAuthStore } from '@/store/authStore';

export function useDashboardData() {
  const { user } = useAuthStore();

  // 1. Dashboard summary stats (KPIs, status breakdown, state/district breakdown)
  const dashboardQuery = useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: async () => {
      const res = await reportsApi.dashboard();
      return res.data.data;
    },
    refetchInterval: 30000, // Refetch live dashboard data every 30 seconds
  });

  // 2. Recent dispatches list
  const dispatchesQuery = useQuery({
    queryKey: ['recentDispatches'],
    queryFn: async () => {
      const res = await dispatchApi.list({ page: 1, limit: 10 });
      return res.data.data;
    },
    refetchInterval: 30000,
  });

  // 3. Pending receipts (only shown/fetched for non-admin state/district users)
  const isOfficer = user?.role === 'STATE_OFFICER' || user?.role === 'DISTRICT_OFFICER';
  const pendingReceiptsQuery = useQuery({
    queryKey: ['pendingReceipts'],
    queryFn: async () => {
      const res = await dispatchApi.getPending();
      return res.data.data;
    },
    enabled: isOfficer,
    refetchInterval: 30000,
  });

  const isLoading =
    dashboardQuery.isLoading ||
    dispatchesQuery.isLoading ||
    (isOfficer && pendingReceiptsQuery.isLoading);

  const isError =
    dashboardQuery.isError ||
    dispatchesQuery.isError ||
    (isOfficer && pendingReceiptsQuery.isError);

  const error =
    dashboardQuery.error ||
    dispatchesQuery.error ||
    (isOfficer ? pendingReceiptsQuery.error : null);

  const refetchAll = () => {
    dashboardQuery.refetch();
    dispatchesQuery.refetch();
    if (isOfficer) pendingReceiptsQuery.refetch();
  };

  const dashboardData = dashboardQuery.data || {};
  const statusCounts = dashboardData.statusCounts || {};
  const unitsByState = dashboardData.unitsByState || [];

  // Calculate KPIs on the fly from database counts
  const totalUnits = Object.values(statusCounts).reduce((a, b) => a + b, 0);
  const controlUnits = unitsByState.reduce((sum, row) => sum + (row.controlUnits || 0), 0);
  const ballotUnits = unitsByState.reduce((sum, row) => sum + (row.ballotUnits || 0), 0);
  const vvpatUnits = unitsByState.reduce((sum, row) => sum + (row.vvpats || row.vvpaTs || 0), 0);

  const kpis = {
    totalUnits,
    controlUnits,
    ballotUnits,
    vvpatUnits,
    inTransit: statusCounts.IN_TRANSIT || 0,
    deployed: statusCounts.DEPLOYED || 0,
    faulty: statusCounts.FAULTY || 0,
  };

  // Format Status Counts dictionary for Donut Chart
  const statusBreakdown = Object.entries(statusCounts).map(([status, count]) => ({
    status,
    count,
  }));

  // Format State Breakdown for Bar Chart
  const stateBreakdown = unitsByState.map((row) => ({
    stateName: row.stateName,
    controlUnits: row.controlUnits,
    ballotUnits: row.ballotUnits,
    vvpatUnits: row.vvpats || row.vvpaTs || 0,
  }));

  const recentDispatches = dispatchesQuery.data || [];
  const pendingReceipts = pendingReceiptsQuery.data || [];

  return {
    kpis,
    statusBreakdown,
    stateBreakdown,
    recentDispatches,
    pendingReceipts,
    isLoading,
    isError,
    error,
    refetchAll,
  };
}
