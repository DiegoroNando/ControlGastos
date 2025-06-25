// ===========================================================================================
// DYNAMIC ROUTE OBFUSCATION SYSTEM v3.0
// ===========================================================================================
// This system provides dynamic, session-based URL obfuscation for the voting system.
// Routes are generated using session ID and cryptographic methods for maximum security.
// 
// SECURITY FEATURES:
// - Dynamic route generation per session
// - Cryptographic obfuscation using session ID
// - Non-repeatable URL patterns
// - Real-time route invalidation
// - Enhanced anti-enumeration protection
// ===========================================================================================

// Route identifiers (internal use only)
const ROUTE_IDENTIFIERS = {
  AUTH: 'auth',
  DASHBOARD: 'dashboard',
  VIEW_CANDIDATES: 'candidates',
  CANDIDATE_PROFILE: 'candidate_profile',
  CANDIDATE_POSTS: 'candidate_posts',
  ADMIN_PASSWORD_SETUP: 'admin_setup',
  ADMIN_STATS: 'admin_stats',
  ADMIN_USERS: 'admin_users',
  ADMIN_BLOCKS: 'admin_blocks',
  ADMIN_CALENDAR: 'admin_calendar',
  ADMIN_WHITELIST: 'admin_whitelist',
  ADMIN_EMAILS: 'admin_emails',
  ADMIN_SETTINGS: 'admin_settings',
  SECURITY_CHECK: 'security_check',
  ACCESS_DENIED: 'access_denied',
  SESSION_EXPIRED: 'session_expired'
} as const;

type RouteIdentifier = keyof typeof ROUTE_IDENTIFIERS;

// Session-based route cache
interface RouteCache {
  sessionId: string;
  timestamp: number;
  routes: Record<string, string>;
  candidateSegments: {
    prefix: string;
    profileSuffix: string;
    postsSuffix: string;
  };
}

class DynamicRouteObfuscator {
  private cache: RouteCache | null = null;
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
  private readonly SEGMENT_LENGTH = 12; // Longer segments for better security
  private readonly CANDIDATE_SEGMENT_LENGTH = 10;

  /**
   * Initialize or refresh routes for a session
   */
  public async initializeSession(sessionId?: string): Promise<void> {
    const currentSessionId = sessionId || await this.generateSessionId();
    const now = Date.now();

    // Check if we need to refresh the cache
    if (this.cache && 
        this.cache.sessionId === currentSessionId && 
        (now - this.cache.timestamp) < this.CACHE_DURATION) {
      return; // Cache is still valid
    }

    // Generate new routes for this session
    this.cache = {
      sessionId: currentSessionId,
      timestamp: now,
      routes: await this.generateSessionRoutes(currentSessionId),
      candidateSegments: await this.generateCandidateSegments(currentSessionId)
    };

    // Store in sessionStorage for persistence across page loads
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('routeCache', JSON.stringify(this.cache));
    }

    console.log('🔄 Dynamic routes initialized for session:', currentSessionId.substring(0, 8) + '...');
  }

  /**
   * Get obfuscated route for a given identifier
   */
  public getRoute(identifier: RouteIdentifier): string {
    if (!this.cache) {
      this.loadCacheFromStorage();
    }

    if (!this.cache) {
      throw new Error('Route cache not initialized. Call initializeSession() first.');
    }

    const internalId = ROUTE_IDENTIFIERS[identifier];
    const route = this.cache.routes[internalId];

    if (!route) {
      throw new Error(`Route not found for identifier: ${identifier}`);
    }

    return route;
  }

  /**
   * Generate candidate profile URL with dynamic segments
   */
  public generateCandidateProfileUrl(candidateId: string): string {
    if (!this.cache) {
      throw new Error('Route cache not initialized');
    }

    const { prefix, profileSuffix } = this.cache.candidateSegments;
    return `/${prefix}/${candidateId}/${profileSuffix}`;
  }

  /**
   * Generate candidate posts URL with dynamic segments
   */
  public generateCandidatePostsUrl(candidateId: string): string {
    if (!this.cache) {
      throw new Error('Route cache not initialized');
    }

    const { prefix, postsSuffix } = this.cache.candidateSegments;
    return `/${prefix}/${candidateId}/${postsSuffix}`;
  }

  /**
   * Extract candidate ID from obfuscated URL
   */
  public extractCandidateId(pathname: string): string | null {
    if (!this.cache) {
      return null;
    }

    const { prefix, profileSuffix, postsSuffix } = this.cache.candidateSegments;
    const profilePattern = new RegExp(`^/${prefix}/([^/]+)/${profileSuffix}$`);
    const postsPattern = new RegExp(`^/${prefix}/([^/]+)/${postsSuffix}$`);

    const profileMatch = pathname.match(profilePattern);
    if (profileMatch) return profileMatch[1];

    const postsMatch = pathname.match(postsPattern);
    if (postsMatch) return postsMatch[1];

    return null;
  }

  /**
   * Validate if a route belongs to current session
   */
  public isValidSessionRoute(pathname: string): boolean {
    if (!this.cache) {
      return false;
    }

    // Check against all generated routes
    const validRoutes = Object.values(this.cache.routes);
    if (validRoutes.some(route => pathname.startsWith(route))) {
      return true;
    }

    // Check candidate routes
    const { prefix } = this.cache.candidateSegments;
    const candidatePattern = new RegExp(`^/${prefix}/[^/]+/(${this.cache.candidateSegments.profileSuffix}|${this.cache.candidateSegments.postsSuffix})$`);
    return candidatePattern.test(pathname);
  }

  /**
   * Force route regeneration
   */
  public async regenerateRoutes(): Promise<void> {
    this.cache = null;
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('routeCache');
    }
    await this.initializeSession();
  }

  /**
   * Get current session ID
   */
  public getCurrentSessionId(): string | null {
    return this.cache?.sessionId || null;
  }

  /**
   * Generate a unique session ID
   */
  private async generateSessionId(): Promise<string> {
    const timestamp = Date.now().toString(36);
    
    // Use Web Crypto API for secure random generation
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      const array = new Uint8Array(16);
      window.crypto.getRandomValues(array);
      const random = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
      return `${timestamp}_${random}`;
    } else {
      // Fallback for server-side or environments without Web Crypto API
      const random = Math.random().toString(36).substring(2, 18);
      return `${timestamp}_${random}`;
    }
  }

  /**
   * Generate session-specific routes
   */
  private async generateSessionRoutes(sessionId: string): Promise<Record<string, string>> {
    const routes: Record<string, string> = {};

    for (const [key, internalId] of Object.entries(ROUTE_IDENTIFIERS)) {
      if (key.startsWith('ADMIN_') && key !== 'ADMIN_PASSWORD_SETUP') {
        // Admin sub-routes (relative paths)
        routes[internalId] = await this.generateSecureSegment(sessionId, internalId, 8);
      } else {
        // Main routes (absolute paths)
        routes[internalId] = '/' + await this.generateSecureSegment(sessionId, internalId, this.SEGMENT_LENGTH);
      }
    }

    return routes;
  }

  /**
   * Generate candidate route segments
   */
  private async generateCandidateSegments(sessionId: string): Promise<RouteCache['candidateSegments']> {
    return {
      prefix: await this.generateSecureSegment(sessionId, 'candidate_prefix', this.CANDIDATE_SEGMENT_LENGTH),
      profileSuffix: await this.generateSecureSegment(sessionId, 'profile_suffix', 8),
      postsSuffix: await this.generateSecureSegment(sessionId, 'posts_suffix', 8)
    };
  }

  /**
   * Generate cryptographically secure route segment using Web Crypto API
   */
  private async generateSecureSegment(sessionId: string, routeType: string, length: number): Promise<string> {
    // Create a unique seed combining session ID, route type, and current time
    const seed = `${sessionId}_${routeType}_${Math.floor(Date.now() / 1000)}`;
    
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      try {
        // Use Web Crypto API for secure hashing
        const encoder = new TextEncoder();
        const data = encoder.encode(seed);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
        const hashArray = new Uint8Array(hashBuffer);
        
        // Convert to base36 for URL-safe characters
        const hash = Array.from(hashArray)
          .map(b => b.toString(36))
          .join('')
          .substring(0, length);
        
        // Ensure minimum length
        if (hash.length >= length) {
          return hash.substring(0, length);
        }
        
        // Pad with additional secure random if needed
        const additional = this.generateFallbackRandom(length - hash.length);
        return (hash + additional).substring(0, length);
      } catch (error) {
        console.warn('Web Crypto API failed, using fallback:', error);
      }
    }

    // Fallback method using simple hash
    return this.generateFallbackSegment(seed, length);
  }

  /**
   * Fallback segment generation for environments without Web Crypto API
   */
  private generateFallbackSegment(seed: string, length: number): string {
    // Simple hash function for fallback
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Convert to base36 and ensure length
    const segment = Math.abs(hash).toString(36);
    const random = this.generateFallbackRandom(Math.max(0, length - segment.length));
    
    return (segment + random).substring(0, length);
  }

  /**
   * Generate fallback random string
   */
  private generateFallbackRandom(length: number): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Load cache from sessionStorage
   */
  private loadCacheFromStorage(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const stored = sessionStorage.getItem('routeCache');
      if (stored) {
        const cache = JSON.parse(stored) as RouteCache;
        const now = Date.now();
        
        // Check if cache is still valid
        if ((now - cache.timestamp) < this.CACHE_DURATION) {
          this.cache = cache;
          return;
        }
      }
    } catch (error) {
      console.warn('Failed to load route cache from storage:', error);
    }

    // If no valid cache found, initialize new session (async)
    this.initializeSession().catch(error => {
      console.error('Failed to initialize session:', error);
    });
  }
}

// Singleton instance
export const routeObfuscator = new DynamicRouteObfuscator();

// Convenience functions for backward compatibility
export const initializeDynamicRoutes = async (sessionId?: string): Promise<void> => {
  await routeObfuscator.initializeSession(sessionId);
};

export const getDynamicRoute = (identifier: RouteIdentifier): string => {
  return routeObfuscator.getRoute(identifier);
};

export const generateDynamicCandidateProfileUrl = (candidateId: string): string => {
  return routeObfuscator.generateCandidateProfileUrl(candidateId);
};

export const generateDynamicCandidatePostsUrl = (candidateId: string): string => {
  return routeObfuscator.generateCandidatePostsUrl(candidateId);
};

export const extractDynamicCandidateId = (pathname: string): string | null => {
  return routeObfuscator.extractCandidateId(pathname);
};

export const isValidDynamicRoute = (pathname: string): boolean => {
  return routeObfuscator.isValidSessionRoute(pathname);
};

export const regenerateDynamicRoutes = async (): Promise<void> => {
  await routeObfuscator.regenerateRoutes();
};

// Export route identifiers for type safety
export { ROUTE_IDENTIFIERS };
export type { RouteIdentifier };

// Route identifiers (internal use only)
const ROUTE_IDENTIFIERS = {
  AUTH: 'auth',
  DASHBOARD: 'dashboard',
  VIEW_CANDIDATES: 'candidates',
  CANDIDATE_PROFILE: 'candidate_profile',
  CANDIDATE_POSTS: 'candidate_posts',
  ADMIN_PASSWORD_SETUP: 'admin_setup',
  ADMIN_STATS: 'admin_stats',
  ADMIN_USERS: 'admin_users',
  ADMIN_BLOCKS: 'admin_blocks',
  ADMIN_CALENDAR: 'admin_calendar',
  ADMIN_WHITELIST: 'admin_whitelist',
  ADMIN_EMAILS: 'admin_emails',
  ADMIN_SETTINGS: 'admin_settings',
  SECURITY_CHECK: 'security_check',
  ACCESS_DENIED: 'access_denied',
  SESSION_EXPIRED: 'session_expired'
} as const;

type RouteIdentifier = keyof typeof ROUTE_IDENTIFIERS;

// Session-based route cache
interface RouteCache {
  sessionId: string;
  timestamp: number;
  routes: Record<string, string>;
  candidateSegments: {
    prefix: string;
    profileSuffix: string;
    postsSuffix: string;
  };
}

class DynamicRouteObfuscator {
  private cache: RouteCache | null = null;
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
  private readonly SEGMENT_LENGTH = 12; // Longer segments for better security
  private readonly CANDIDATE_SEGMENT_LENGTH = 10;

  /**
   * Initialize or refresh routes for a session
   */
  public initializeSession(sessionId?: string): void {
    const currentSessionId = sessionId || this.generateSessionId();
    const now = Date.now();

    // Check if we need to refresh the cache
    if (this.cache && 
        this.cache.sessionId === currentSessionId && 
        (now - this.cache.timestamp) < this.CACHE_DURATION) {
      return; // Cache is still valid
    }

    // Generate new routes for this session
    this.cache = {
      sessionId: currentSessionId,
      timestamp: now,
      routes: this.generateSessionRoutes(currentSessionId),
      candidateSegments: this.generateCandidateSegments(currentSessionId)
    };

    // Store in sessionStorage for persistence across page loads
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('routeCache', JSON.stringify(this.cache));
    }

    console.log('🔄 Dynamic routes initialized for session:', currentSessionId.substring(0, 8) + '...');
  }

  /**
   * Get obfuscated route for a given identifier
   */
  public getRoute(identifier: RouteIdentifier): string {
    if (!this.cache) {
      this.loadCacheFromStorage();
    }

    if (!this.cache) {
      throw new Error('Route cache not initialized. Call initializeSession() first.');
    }

    const internalId = ROUTE_IDENTIFIERS[identifier];
    const route = this.cache.routes[internalId];

    if (!route) {
      throw new Error(`Route not found for identifier: ${identifier}`);
    }

    return route;
  }

  /**
   * Generate candidate profile URL with dynamic segments
   */
  public generateCandidateProfileUrl(candidateId: string): string {
    if (!this.cache) {
      throw new Error('Route cache not initialized');
    }

    const { prefix, profileSuffix } = this.cache.candidateSegments;
    return `/${prefix}/${candidateId}/${profileSuffix}`;
  }

  /**
   * Generate candidate posts URL with dynamic segments
   */
  public generateCandidatePostsUrl(candidateId: string): string {
    if (!this.cache) {
      throw new Error('Route cache not initialized');
    }

    const { prefix, postsSuffix } = this.cache.candidateSegments;
    return `/${prefix}/${candidateId}/${postsSuffix}`;
  }

  /**
   * Extract candidate ID from obfuscated URL
   */
  public extractCandidateId(pathname: string): string | null {
    if (!this.cache) {
      return null;
    }

    const { prefix, profileSuffix, postsSuffix } = this.cache.candidateSegments;
    const profilePattern = new RegExp(`^/${prefix}/([^/]+)/${profileSuffix}$`);
    const postsPattern = new RegExp(`^/${prefix}/([^/]+)/${postsSuffix}$`);

    const profileMatch = pathname.match(profilePattern);
    if (profileMatch) return profileMatch[1];

    const postsMatch = pathname.match(postsPattern);
    if (postsMatch) return postsMatch[1];

    return null;
  }

  /**
   * Validate if a route belongs to current session
   */
  public isValidSessionRoute(pathname: string): boolean {
    if (!this.cache) {
      return false;
    }

    // Check against all generated routes
    const validRoutes = Object.values(this.cache.routes);
    if (validRoutes.some(route => pathname.startsWith(route))) {
      return true;
    }

    // Check candidate routes
    const { prefix } = this.cache.candidateSegments;
    const candidatePattern = new RegExp(`^/${prefix}/[^/]+/(${this.cache.candidateSegments.profileSuffix}|${this.cache.candidateSegments.postsSuffix})$`);
    return candidatePattern.test(pathname);
  }

  /**
   * Force route regeneration
   */
  public regenerateRoutes(): void {
    this.cache = null;
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('routeCache');
    }
    this.initializeSession();
  }

  /**
   * Get current session ID
   */
  public getCurrentSessionId(): string | null {
    return this.cache?.sessionId || null;
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const random = randomBytes(16).toString('hex');
    return `${timestamp}_${random}`;
  }

  /**
   * Generate session-specific routes
   */
  private generateSessionRoutes(sessionId: string): Record<string, string> {
    const routes: Record<string, string> = {};

    Object.entries(ROUTE_IDENTIFIERS).forEach(([key, internalId]) => {
      if (key.startsWith('ADMIN_') && key !== 'ADMIN_PASSWORD_SETUP') {
        // Admin sub-routes (relative paths)
        routes[internalId] = this.generateSecureSegment(sessionId, internalId, 8);
      } else {
        // Main routes (absolute paths)
        routes[internalId] = '/' + this.generateSecureSegment(sessionId, internalId, this.SEGMENT_LENGTH);
      }
    });

    return routes;
  }

  /**
   * Generate candidate route segments
   */
  private generateCandidateSegments(sessionId: string): RouteCache['candidateSegments'] {
    return {
      prefix: this.generateSecureSegment(sessionId, 'candidate_prefix', this.CANDIDATE_SEGMENT_LENGTH),
      profileSuffix: this.generateSecureSegment(sessionId, 'profile_suffix', 8),
      postsSuffix: this.generateSecureSegment(sessionId, 'posts_suffix', 8)
    };
  }

  /**
   * Generate cryptographically secure route segment
   */
  private generateSecureSegment(sessionId: string, routeType: string, length: number): string {
    // Create a unique seed combining session ID, route type, and current time
    const seed = `${sessionId}_${routeType}_${Math.floor(Date.now() / 1000)}`;
    
    // Generate hash using SHA-256
    const hash = createHash('sha256').update(seed).digest('hex');
    
    // Convert to base36 for URL-safe characters and take required length
    const segment = parseInt(hash.substring(0, 8), 16).toString(36);
    
    // Ensure minimum length and add randomness
    const randomSuffix = randomBytes(4).toString('hex').substring(0, Math.max(0, length - segment.length));
    
    return (segment + randomSuffix).substring(0, length);
  }

  /**
   * Load cache from sessionStorage
   */
  private loadCacheFromStorage(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const stored = sessionStorage.getItem('routeCache');
      if (stored) {
        const cache = JSON.parse(stored) as RouteCache;
        const now = Date.now();
        
        // Check if cache is still valid
        if ((now - cache.timestamp) < this.CACHE_DURATION) {
          this.cache = cache;
          return;
        }
      }
    } catch (error) {
      console.warn('Failed to load route cache from storage:', error);
    }

    // If no valid cache found, initialize new session
    this.initializeSession();
  }
}

// Singleton instance
export const routeObfuscator = new DynamicRouteObfuscator();

// Convenience functions for backward compatibility
export const initializeDynamicRoutes = (sessionId?: string) => {
  routeObfuscator.initializeSession(sessionId);
};

export const getDynamicRoute = (identifier: RouteIdentifier): string => {
  return routeObfuscator.getRoute(identifier);
};

export const generateDynamicCandidateProfileUrl = (candidateId: string): string => {
  return routeObfuscator.generateCandidateProfileUrl(candidateId);
};

export const generateDynamicCandidatePostsUrl = (candidateId: string): string => {
  return routeObfuscator.generateCandidatePostsUrl(candidateId);
};

export const extractDynamicCandidateId = (pathname: string): string | null => {
  return routeObfuscator.extractCandidateId(pathname);
};

export const isValidDynamicRoute = (pathname: string): boolean => {
  return routeObfuscator.isValidSessionRoute(pathname);
};

export const regenerateDynamicRoutes = (): void => {
  routeObfuscator.regenerateRoutes();
};

// Export route identifiers for type safety
export { ROUTE_IDENTIFIERS };
export type { RouteIdentifier };
