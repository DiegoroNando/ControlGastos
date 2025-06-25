// ===========================================================================================
// ROUTE SECURITY SERVICE
// ===========================================================================================
// This service provides additional security utilities for route obfuscation and validation.
// It works in conjunction with the enhanced route obfuscation system in constants.ts
// ===========================================================================================

import { ROUTES, isAdminRoute, isPublicRoute, validateRoutePattern } from '../constants';
import { UserRole } from '../types';

// Route access validation
export interface RouteAccessResult {
  allowed: boolean;
  reason?: string;
  redirectTo?: string;
}

// Enhanced route security checker
export const validateRouteAccess = (
  pathname: string,
  userRole?: UserRole,
  isAuthenticated: boolean = false
): RouteAccessResult => {
  
  // Check if route pattern is valid (prevents URL manipulation)
  if (!isValidRoute(pathname)) {
    return {
      allowed: false,
      reason: 'Invalid route pattern',
      redirectTo: ROUTES.AUTH
    };
  }

  // Public routes - always accessible
  if (isPublicRoute(pathname)) {
    return { allowed: true };
  }

  // Protected routes require authentication
  if (!isAuthenticated) {
    return {
      allowed: false,
      reason: 'Authentication required',
      redirectTo: ROUTES.AUTH
    };
  }

  // Admin routes require admin privileges
  if (isAdminRoute(pathname)) {
    if (userRole !== UserRole.SUPERADMIN) {
      return {
        allowed: false,
        reason: 'Admin privileges required',
        redirectTo: ROUTES.DASHBOARD
      };
    }
  }

  return { allowed: true };
};

// Validate if a route exists in our system
export const isValidRoute = (pathname: string): boolean => {
  // Remove hash and query parameters for validation
  const cleanPath = pathname.split('?')[0].split('#')[0];
  
  // Check against all defined routes
  const allRoutes = Object.values(ROUTES);
  
  // Direct route match
  if (allRoutes.includes(cleanPath)) {
    return true;
  }

  // Check parameterized routes (like candidate profiles)
  if (cleanPath.includes('/u6r2t5x8/') && 
      (cleanPath.includes('/d5f8h3w7') || cleanPath.includes('/p9l3k6m2'))) {
    return true;
  }

  // Check admin sub-routes
  if (cleanPath.startsWith(ROUTES.DASHBOARD + '/')) {
    const subRoute = cleanPath.replace(ROUTES.DASHBOARD + '/', '');
    const adminRoutes = [
      ROUTES.ADMIN_STATS,
      ROUTES.ADMIN_USERS,
      ROUTES.ADMIN_BLOCKS,
      ROUTES.ADMIN_CALENDAR,
      ROUTES.ADMIN_WHITELIST,
      ROUTES.ADMIN_EMAILS,
      ROUTES.ADMIN_SETTINGS
    ];
    return adminRoutes.includes(subRoute);
  }

  // Check if it matches any route pattern
  return validateRoutePattern(cleanPath);
};

// Generate obfuscated URLs for candidate profiles
export const generateCandidateProfileUrl = (candidateId: string): string => {
  return ROUTES.CANDIDATE_PROFILE.replace(':candidateId', candidateId);
};

// Generate obfuscated URLs for candidate posts
export const generateCandidatePostsUrl = (candidateId: string): string => {
  return ROUTES.CANDIDATE_POSTS.replace(':candidateId', candidateId);
};

// Generate obfuscated admin URLs
export const generateAdminUrl = (section: string): string => {
  const adminRoutes: Record<string, string> = {
    'statistics': ROUTES.DASHBOARD,
    'users': `${ROUTES.DASHBOARD}/${ROUTES.ADMIN_USERS}`,
    'blocks': `${ROUTES.DASHBOARD}/${ROUTES.ADMIN_BLOCKS}`,
    'calendar': `${ROUTES.DASHBOARD}/${ROUTES.ADMIN_CALENDAR}`,
    'whitelist': `${ROUTES.DASHBOARD}/${ROUTES.ADMIN_WHITELIST}`,
    'emails': `${ROUTES.DASHBOARD}/${ROUTES.ADMIN_EMAILS}`,
    'settings': `${ROUTES.DASHBOARD}/${ROUTES.ADMIN_SETTINGS}`,
  };
  
  return adminRoutes[section] || ROUTES.DASHBOARD;
};

// Extract candidate ID from obfuscated candidate URLs
export const extractCandidateId = (pathname: string): string | null => {
  const candidateRoutePattern = /\/u6r2t5x8\/([^\/]+)\/(d5f8h3w7|p9l3k6m2)/;
  const match = pathname.match(candidateRoutePattern);
  return match ? match[1] : null;
};

// Security logging for suspicious route access attempts
export const logSuspiciousActivity = (
  pathname: string,
  userAgent?: string,
  ip?: string,
  reason?: string
): void => {
  // In a production environment, this would log to a security monitoring system
  console.warn('🚨 SECURITY: Suspicious route access attempt', {
    pathname,
    userAgent,
    ip,
    reason,
    timestamp: new Date().toISOString()
  });
};

// Route obfuscation validator - ensures routes haven't been tampered with
export const validateRouteIntegrity = (): boolean => {
  const expectedRoutes = [
    '/x7k9p2m8', // AUTH
    '/m4n8q7z2', // DASHBOARD
    '/z3v7w9k4', // VIEW_CANDIDATES
    '/u6r2t5x8/:candidateId/d5f8h3w7', // CANDIDATE_PROFILE
    '/u6r2t5x8/:candidateId/p9l3k6m2', // CANDIDATE_POSTS
    '/a2d3m1n8k7/s3tup9p4ssw0rd6z1', // ADMIN_PASSWORD_SETUP
  ];

  const actualRoutes = [
    ROUTES.AUTH,
    ROUTES.DASHBOARD,
    ROUTES.VIEW_CANDIDATES,
    ROUTES.CANDIDATE_PROFILE,
    ROUTES.CANDIDATE_POSTS,
    ROUTES.ADMIN_PASSWORD_SETUP,
  ];

  return expectedRoutes.every((route, index) => route === actualRoutes[index]);
};

// Initialize route security on app startup
export const initializeRouteSecurity = (): void => {
  if (!validateRouteIntegrity()) {
    console.error('🚨 SECURITY ALERT: Route integrity check failed!');
    logSuspiciousActivity(
      window.location.pathname,
      navigator.userAgent,
      'unknown',
      'Route integrity validation failed'
    );
  } else {
    console.log('✅ Route security initialized successfully');
  }
};
