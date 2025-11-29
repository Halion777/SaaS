import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import TableLoader from './ui/TableLoader';
import SubscriptionGuard from './SubscriptionGuard';

/**
 * Protected route component that redirects to login if user is not authenticated
 * and checks for valid subscription
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if authenticated
 * @param {boolean} props.skipSubscriptionCheck - Skip subscription check (for subscription management page)
 * @returns {React.ReactNode} - Protected route or redirect
 */
const ProtectedRoute = ({ children, skipSubscriptionCheck = false }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();
  
  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <TableLoader 
          message={t('ui.loading', 'Chargement...')}
          className="h-screen"
        />
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  
  // Skip subscription check for certain pages (like subscription management itself)
  if (skipSubscriptionCheck) {
    return children;
  }
  
  // Wrap with subscription guard to check valid subscription
  return (
    <SubscriptionGuard>
      {children}
    </SubscriptionGuard>
  );
};

export default ProtectedRoute; 