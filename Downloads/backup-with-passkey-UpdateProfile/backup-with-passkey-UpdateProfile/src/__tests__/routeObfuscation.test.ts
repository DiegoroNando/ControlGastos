// ===========================================================================================
// ROUTE OBFUSCATION SYSTEM TESTS
// ===========================================================================================
// This test file validates the complete route obfuscation implementation
// ===========================================================================================

import { ROUTES } from '../constants';
import { 
  validateRouteAccess, 
  isValidRoute, 
  isAdminRoute, 
  isPublicRoute,
  generateCandidateProfileUrl,
  generateCandidatePostsUrl,
  extractCandidateId,
  initializeRouteSecurity
} from '../services/routeSecurityService';
import { UserRole } from '../types';

describe('Route Obfuscation System', () => {
  beforeAll(() => {
    // Initialize route security before tests
    initializeRouteSecurity();
  });

  describe('Route Constants Validation', () => {
    test('All routes should be properly obfuscated', () => {
      // Verify routes don't contain obvious patterns
      expect(ROUTES.AUTH).not.toContain('auth');
      expect(ROUTES.AUTH).not.toContain('login');
      expect(ROUTES.DASHBOARD).not.toContain('dashboard');
      expect(ROUTES.VIEW_CANDIDATES).not.toContain('candidates');
      expect(ROUTES.ADMIN_USERS).not.toContain('users');
      expect(ROUTES.ADMIN_SETTINGS).not.toContain('settings');
      
      // Verify routes are not empty and have proper format
      expect(ROUTES.AUTH).toMatch(/^\/[a-z0-9]{8,}$/);
      expect(ROUTES.DASHBOARD).toMatch(/^\/[a-z0-9]{8,}$/);
      expect(ROUTES.VIEW_CANDIDATES).toMatch(/^\/[a-z0-9]{8,}$/);
    });

    test('Route obfuscation should be consistent', () => {
      // Routes should maintain consistent length and format
      expect(ROUTES.AUTH.length).toBeGreaterThan(8);
      expect(ROUTES.DASHBOARD.length).toBeGreaterThan(8);
      expect(ROUTES.VIEW_CANDIDATES.length).toBeGreaterThan(8);
      
      // Admin routes should have proper obfuscation
      expect(ROUTES.ADMIN_USERS.length).toBeGreaterThan(6);
      expect(ROUTES.ADMIN_SETTINGS.length).toBeGreaterThan(6);
      expect(ROUTES.ADMIN_BLOCKS.length).toBeGreaterThan(6);
    });
  });

  describe('Route Security Service', () => {
    test('Should validate route access correctly', () => {
      // Public routes should be accessible without authentication
      const publicAccess = validateRouteAccess(ROUTES.AUTH, undefined, false);
      expect(publicAccess.allowed).toBe(true);

      // Protected routes should require authentication
      const protectedAccess = validateRouteAccess(ROUTES.DASHBOARD, undefined, false);
      expect(protectedAccess.allowed).toBe(false);
      expect(protectedAccess.reason).toBe('Authentication required');

      // Admin routes should require admin privileges
      const adminPath = `${ROUTES.DASHBOARD}/${ROUTES.ADMIN_USERS}`;
      const userAdminAccess = validateRouteAccess(adminPath, UserRole.USER, true);
      expect(userAdminAccess.allowed).toBe(false);
      expect(userAdminAccess.reason).toBe('Admin privileges required');

      const superAdminAccess = validateRouteAccess(adminPath, UserRole.SUPERADMIN, true);
      expect(superAdminAccess.allowed).toBe(true);
    });

    test('Should identify route types correctly', () => {
      // Public routes
      expect(isPublicRoute(ROUTES.AUTH)).toBe(true);
      expect(isPublicRoute(ROUTES.ADMIN_PASSWORD_SETUP)).toBe(true);
      expect(isPublicRoute(ROUTES.DASHBOARD)).toBe(false);

      // Admin routes
      const adminPath = `${ROUTES.DASHBOARD}/${ROUTES.ADMIN_USERS}`;
      expect(isAdminRoute(adminPath)).toBe(true);
      expect(isAdminRoute(ROUTES.DASHBOARD)).toBe(false);
      expect(isAdminRoute(ROUTES.VIEW_CANDIDATES)).toBe(false);
    });

    test('Should validate route existence correctly', () => {
      // Valid routes
      expect(isValidRoute(ROUTES.AUTH)).toBe(true);
      expect(isValidRoute(ROUTES.DASHBOARD)).toBe(true);
      expect(isValidRoute(ROUTES.VIEW_CANDIDATES)).toBe(true);

      // Invalid routes
      expect(isValidRoute('/invalid-route')).toBe(false);
      expect(isValidRoute('/dashboard')).toBe(false); // Old unobfuscated route
      expect(isValidRoute('/auth')).toBe(false); // Old unobfuscated route
    });
  });

  describe('Candidate URL Generation', () => {
    test('Should generate secure candidate URLs', () => {
      const candidateId = 'test-candidate-123';
      
      const profileUrl = generateCandidateProfileUrl(candidateId);
      const postsUrl = generateCandidatePostsUrl(candidateId);

      // URLs should contain obfuscated segments
      expect(profileUrl).toContain('u6r2t5x8');
      expect(profileUrl).toContain('d5f8h3w7');
      expect(profileUrl).toContain(candidateId);

      expect(postsUrl).toContain('u6r2t5x8');
      expect(postsUrl).toContain('p9l3k6m2');
      expect(postsUrl).toContain(candidateId);

      // URLs should be valid routes
      expect(isValidRoute(profileUrl)).toBe(true);
      expect(isValidRoute(postsUrl)).toBe(true);
    });

    test('Should extract candidate ID from URLs correctly', () => {
      const candidateId = 'test-candidate-456';
      const profileUrl = generateCandidateProfileUrl(candidateId);
      const postsUrl = generateCandidatePostsUrl(candidateId);

      expect(extractCandidateId(profileUrl)).toBe(candidateId);
      expect(extractCandidateId(postsUrl)).toBe(candidateId);
      expect(extractCandidateId('/invalid/path')).toBeNull();
    });
  });

  describe('Security Features', () => {
    test('Should prevent access to common attack patterns', () => {
      const attackPatterns = [
        '/admin',
        '/dashboard',
        '/users',
        '/candidates',
        '/auth',
        '/login',
        '/settings',
        '/api',
        '/.env',
        '/config'
      ];

      attackPatterns.forEach(pattern => {
        expect(isValidRoute(pattern)).toBe(false);
      });
    });

    test('Should handle malformed URLs safely', () => {
      const malformedUrls = [
        '',
        '/',
        '//',
        '/../',
        '/./.',
        '/admin/../users',
        '/%2e%2e%2f',
        '/null',
        '/undefined'
      ];

      malformedUrls.forEach(url => {
        expect(() => isValidRoute(url)).not.toThrow();
        expect(() => validateRouteAccess(url, UserRole.USER, true)).not.toThrow();
      });
    });
  });

  describe('Route Integrity', () => {
    test('All route constants should be properly defined', () => {
      const requiredRoutes = [
        'AUTH',
        'DASHBOARD', 
        'VIEW_CANDIDATES',
        'CANDIDATE_PROFILE',
        'CANDIDATE_POSTS',
        'ADMIN_USERS',
        'ADMIN_BLOCKS',
        'ADMIN_CALENDAR',
        'ADMIN_WHITELIST',
        'ADMIN_EMAILS',
        'ADMIN_SETTINGS',
        'ADMIN_PASSWORD_SETUP'
      ];

      requiredRoutes.forEach(routeName => {
        expect(ROUTES[routeName as keyof typeof ROUTES]).toBeDefined();
        expect(typeof ROUTES[routeName as keyof typeof ROUTES]).toBe('string');
        expect(ROUTES[routeName as keyof typeof ROUTES].length).toBeGreaterThan(0);
      });
    });

    test('No route should contain sensitive information', () => {
      const sensitiveTerms = [
        'admin',
        'user', 
        'auth',
        'login',
        'password',
        'config',
        'setting',
        'manage',
        'dashboard'
      ];

      Object.values(ROUTES).forEach(route => {
        sensitiveTerms.forEach(term => {
          expect(route.toLowerCase()).not.toContain(term);
        });
      });
    });
  });
});

describe('Route Security Integration', () => {
  test('Should integrate properly with React Router', () => {
    // Test that routes can be used in navigation
    const testRoutes = [
      ROUTES.AUTH,
      ROUTES.DASHBOARD,
      ROUTES.VIEW_CANDIDATES
    ];

    testRoutes.forEach(route => {
      expect(route.startsWith('/')).toBe(true);
      expect(route.length).toBeGreaterThan(1);
    });
  });

  test('Should maintain backward compatibility where needed', () => {
    // Ensure old routes are properly redirected or blocked
    const legacyRoutes = ['/dashboard', '/auth', '/admin'];
    
    legacyRoutes.forEach(route => {
      expect(isValidRoute(route)).toBe(false);
    });
  });
});

// Performance test for route security
describe('Route Security Performance', () => {
  test('Route validation should be fast', () => {
    const start = performance.now();
    
    // Test 1000 route validations
    for (let i = 0; i < 1000; i++) {
      validateRouteAccess(ROUTES.DASHBOARD, UserRole.USER, true);
      isValidRoute(ROUTES.AUTH);
      isAdminRoute(`${ROUTES.DASHBOARD}/${ROUTES.ADMIN_USERS}`);
    }
    
    const end = performance.now();
    const duration = end - start;
    
    // Should complete 1000 validations in under 100ms
    expect(duration).toBeLessThan(100);
  });
});
