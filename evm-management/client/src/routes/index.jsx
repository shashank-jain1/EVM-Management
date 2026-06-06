import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import ProtectedRoute from './ProtectedRoute';
import Spinner from '@/components/common/Spinner';
import AdminLayout from '@/components/layout/AdminLayout';
import AuthLayout from '@/components/layout/AuthLayout';

// Lazy-loaded pages (code splitting)
const LoginPage         = lazy(() => import('@/features/auth/LoginPage'));
const DashboardPage     = lazy(() => import('@/features/dashboard/DashboardPage'));
const EVMListPage        = lazy(() => import('@/features/evm/EVMListPage'));
const EVMDetailPage      = lazy(() => import('@/features/evm/EVMDetailPage'));
const EVMRegisterPage    = lazy(() => import('@/features/evm/EVMRegisterPage'));
const DispatchPage       = lazy(() => import('@/features/evm/dispatch/DispatchPage'));
const DispatchDetailPage = lazy(() => import('@/features/evm/dispatch/DispatchDetailPage'));
const ReceivePage        = lazy(() => import('@/features/evm/receive/ReceivePage'));
const UsersPage          = lazy(() => import('@/features/users/UsersPage'));
const ReportsPage        = lazy(() => import('@/features/reports/ReportsPage'));
const GlobalSearchPage   = lazy(() => import('@/features/search/GlobalSearchPage'));
const AuditLogPage       = lazy(() => import('@/features/audit/AuditLogPage'));
const NotFoundPage       = lazy(() => import('@/features/NotFoundPage'));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <Spinner size="lg" />
  </div>
);

function RootRedirect() {
  const { isAuthenticated } = useAuthStore();
  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />;
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<RootRedirect />} />

          {/* Auth routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/dashboard"        element={<DashboardPage />} />
              <Route path="/evm"              element={<EVMListPage />} />
              <Route path="/evm/:id"          element={<EVMDetailPage />} />
              <Route path="/evm/register"     element={<ProtectedRoute roles={['ADMIN', 'STATE_OFFICER', 'DISTRICT_OFFICER']}><EVMRegisterPage /></ProtectedRoute>} />
              <Route path="/dispatch"         element={<DispatchPage />} />
              <Route path="/dispatch/:id"     element={<DispatchDetailPage />} />
              <Route path="/receive"          element={<ReceivePage />} />
              <Route path="/users"            element={<ProtectedRoute roles={['ADMIN']}><UsersPage /></ProtectedRoute>} />
              <Route path="/reports"          element={<ReportsPage />} />
              <Route path="/search"           element={<GlobalSearchPage />} />
              <Route path="/audit"            element={<ProtectedRoute roles={['ADMIN']}><AuditLogPage /></ProtectedRoute>} />
            </Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
