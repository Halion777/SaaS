import React, { useState, useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { supabase } from '../services/supabaseClient';
import TableLoader from './ui/TableLoader';

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
  const { t } = useTranslation();
  const [userRole, setUserRole] = useState(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const [roleChecked, setRoleChecked] = useState(false);
  const roleCheckRef = useRef(null);
  
  // Check user role from database
  useEffect(() => {
    const checkUserRole = async () => {
      // Only proceed if we have a user and are authenticated
      if (!user || !isAuthenticated) {
        roleCheckRef.current = { role: null, completed: true };
        setRoleLoading(false);
        setRoleChecked(true);
        return;
      }

      // If we already have a role for this user, don't check again
      if (roleCheckRef.current?.completed && roleCheckRef.current?.userId === user.id) {
        setUserRole(roleCheckRef.current.role);
        setRoleLoading(false);
        setRoleChecked(true);
        return;
      }

      try {
        const { data: userData, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        const finalRole = (!error && userData) ? userData.role : null;
        
        // Store the result in ref immediately with user ID
        roleCheckRef.current = { role: finalRole, completed: true, userId: user.id };
        
        setUserRole(finalRole);
      } catch (error) {
        console.error('Error checking user role:', error);
        roleCheckRef.current = { role: null, completed: true, userId: user.id };
        setUserRole(null);
      } finally {
        setRoleLoading(false);
        setRoleChecked(true);
      }
    };

    // Only reset states if user actually changed
    if (!roleCheckRef.current?.completed || roleCheckRef.current?.userId !== user?.id) {
      setRoleLoading(true);
      setRoleChecked(false);
      setUserRole(null);
      roleCheckRef.current = { role: null, completed: false, userId: user?.id };
    }
    
    checkUserRole();
  }, [user, isAuthenticated]);
  
  // STRICT CHECKING: Show loading until ALL checks are complete
  if (loading || roleLoading || !roleChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <TableLoader 
          message={t('ui.verifyingAccess', 'Verifying access...')}
          className="h-screen"
        />
      </div>
    );
  }
  
  // Only redirect AFTER role check is complete
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  
  // Only redirect AFTER role check is complete
  const actualRole = roleCheckRef.current?.role || userRole;
  if (!user || actualRole !== 'superadmin') {
    return <Navigate to="/dashboard" replace />;
  }
  
  // Render children if authenticated and is superadmin
  return children;
};

export default SuperAdminProtectedRoute;
