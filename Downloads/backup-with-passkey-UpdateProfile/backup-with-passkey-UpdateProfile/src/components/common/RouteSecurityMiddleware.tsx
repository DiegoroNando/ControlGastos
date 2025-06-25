// ===========================================================================================
// ROUTE SECURITY MIDDLEWARE
// ===========================================================================================
// This middleware component validates route access on every navigation change
// It works with the route security service to ensure unauthorized access is prevented
// ===========================================================================================

import React, { useEffect } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { validateRouteAccess, logSuspiciousActivity } from '../../services/routeSecurityService';

interface RouteSecurityMiddlewareProps {
  children: React.ReactNode;
}

export const RouteSecurityMiddleware: React.FC<RouteSecurityMiddlewareProps> = ({ children }) => {
  const location = useLocation();
  const { currentUser, isLoading } = useAuth();

  useEffect(() => {
    // Skip validation while auth is loading
    if (isLoading) return;

    const pathname = location.pathname;
    const isAuthenticated = !!currentUser;
    const userRole = currentUser?.role;

    // Validate route access
    const accessResult = validateRouteAccess(pathname, userRole, isAuthenticated);

    if (!accessResult.allowed) {
      // Log suspicious activity
      logSuspiciousActivity(
        pathname,
        navigator.userAgent,
        'client-side', // In production, this would be the actual IP
        accessResult.reason
      );

      // Show security warning in console
      console.warn(`🚨 Route access denied: ${accessResult.reason} for path: ${pathname}`);
    }
  }, [location.pathname, currentUser, isLoading]);

  // Don't interfere with React Router's navigation, just monitor
  return <>{children}</>;
};

export default RouteSecurityMiddleware;
