import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Public route component that redirects authenticated users to dashboard
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if not authenticated
 * @returns {React.ReactNode} - Public route or redirect
 */
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-x-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Specific paths that should always be accessible
  const alwaysAccessiblePaths = [
    '/reset-password', 
    '/forgot-password', 
    '/login', 
    '/register'
  ];

  // Check if the current path is in the always accessible list
  const isAlwaysAccessible = alwaysAccessiblePaths.some(path => 
    location.pathname.startsWith(path)
  );

  // If authenticated and not on an always accessible path, redirect to dashboard
  if (isAuthenticated && !isAlwaysAccessible) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // Render children for public routes
  return children;
};

export default PublicRoute; 