import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { normalizeRole, ROLE_PATHS } from '../../data/demoUsers';
import { RefreshCw } from 'lucide-react';

/**
 * ProtectedRoute Component
 * - Verifies that the user is authenticated.
 * - Restricts access based on allowedRoles.
 * - Automatically redirects unauthorized users to their own role-specific dashboard.
 * - Displays a non-flashing loading state while session restoration is in progress.
 */
export const ProtectedRoute = ({ allowedRoles = null, children = null }) => {
  const { isAuthenticated, role, isLoading } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();

  // 1. Session Restoration Loading State
  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          color: '#64748b'
        }}
      >
        <RefreshCw size={28} className="animate-spin" color="#15803d" />
        <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>{t('appLoading')}</span>
      </div>
    );
  }

  // 2. Unauthenticated check -> Redirect to /login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Role-based authorization check
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = normalizeRole(role);
    const normalizedAllowed = allowedRoles.map(normalizeRole);

    if (!normalizedAllowed.includes(userRole)) {
      // User is authenticated but attempting to access an unauthorized portal.
      // Redirect back to their own authorized dashboard.
      const ownDashboard = ROLE_PATHS[userRole] || '/collector';
      return <Navigate to={ownDashboard} replace />;
    }
  }

  // Authorized: render child route
  return children ? children : <Outlet />;
};

export default ProtectedRoute;
