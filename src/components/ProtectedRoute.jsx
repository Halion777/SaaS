import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Protected route component that redirects to login if user is not authenticated
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if authenticated
 * @returns {React.ReactNode} - Protected route or redirect
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  
  // TEMPORARY: Bypass authentication check for development
  const bypassAuth = true; // Set to false to re-enable authentication
  
  // Show loading state while checking authentication
  if (loading && !bypassAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }
  
  // Redirect to login if not authenticated (bypassed if bypassAuth is true)
  if (!isAuthenticated && !bypassAuth) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  
  // Render children if authenticated or bypassing auth
  return children;
};

export default ProtectedRoute; 