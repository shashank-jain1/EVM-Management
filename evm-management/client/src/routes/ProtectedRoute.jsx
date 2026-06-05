import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

/**
 * ProtectedRoute — redirects to /login if not authenticated.
 * Optionally checks roles array (e.g. ['ADMIN']).
 */
export default function ProtectedRoute({ roles, children }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && roles.length > 0 && !roles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  // If children passed (inline usage), render children; else render Outlet for nested routes
  return children ?? <Outlet />;
}
