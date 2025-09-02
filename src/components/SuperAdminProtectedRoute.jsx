import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabaseClient';

/**
 * SuperAdmin protected route component that redirects to login if user is not authenticated
 * or to dashboard if user is not a superadmin
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if authenticated and is superadmin
 * @returns {React.ReactNode} - Protected route or redirect
 */
const SuperAdminProtectedRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();
  const [userRole, setUserRole] = useState(null);
  const [roleLoading, setRoleLoading] = useState(true);
  
  // Check user role from database
  useEffect(() => {
    const checkUserRole = async () => {
      if (!user || !isAuthenticated) {
        setRoleLoading(false);
        return;
      }

      try {
        const { data: userData, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (!error && userData) {
          setUserRole(userData.role);
        } else {
          setUserRole(null);
        }
      } catch (error) {
        console.error('Error checking user role:', error);
        setUserRole(null);
      } finally {
        setRoleLoading(false);
      }
    };

    checkUserRole();
  }, [user, isAuthenticated]);
  
  // Show loading state while checking authentication or role
  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  
  // Redirect to dashboard if not superadmin
  if (!user || userRole !== 'superadmin') {
    return <Navigate to="/dashboard" replace />;
  }
  
  // Render children if authenticated and is superadmin
  return children;
};

export default SuperAdminProtectedRoute;
