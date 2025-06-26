/**
 * Rate Limiter Utility
 * Implements sliding window rate limiting for API endpoints
 */

interface RateLimitConfig {
  requests: number; // Number of requests allowed
  window: number;   // Time window in milliseconds
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
  requests: number[];
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter?: number;
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Check if a request is allowed under the rate limit
   */
  async checkLimit(
    identifier: string,
    endpoint: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const key = `${identifier}:${endpoint}`;
    const now = Date.now();
    const windowStart = now - config.window;

    // Get or create entry
    let entry = this.store.get(key);
    if (!entry) {
      entry = {
        count: 0,
        resetTime: now + config.window,
        requests: []
      };
      this.store.set(key, entry);
    }

    // Remove requests outside the current window
    entry.requests = entry.requests.filter(timestamp => timestamp > windowStart);
    entry.count = entry.requests.length;

    // Check if limit is exceeded
    if (entry.count >= config.requests) {
      // Calculate retry after time
      const oldestRequest = Math.min(...entry.requests);
      const retryAfter = Math.ceil((oldestRequest + config.window - now) / 1000);
      
      return {
        allowed: false,
        remaining: 0,
        retryAfter: retryAfter > 0 ? retryAfter : 1
      };
    }

    // Add current request
    entry.requests.push(now);
    entry.count++;
    entry.resetTime = now + config.window;

    return {
      allowed: true,
      remaining: config.requests - entry.count
    };
  }

  /**
   * Get current rate limit status
   */
  getStatus(identifier: string, endpoint: string): {
    count: number;
    resetTime: number;
  } {
    const key = `${identifier}:${endpoint}`;
    const entry = this.store.get(key);
    
    if (!entry) {
      return {
        count: 0,
        resetTime: Date.now()
      };
    }

    return {
      count: entry.count,
      resetTime: entry.resetTime
    };
  }

  /**
   * Reset rate limit for a specific identifier/endpoint
   */
  reset(identifier: string, endpoint?: string): void {
    if (endpoint) {
      const key = `${identifier}:${endpoint}`;
      this.store.delete(key);
    } else {
      // Reset all endpoints for the identifier
      const keysToDelete = Array.from(this.store.keys())
        .filter(key => key.startsWith(`${identifier}:`));
      
      keysToDelete.forEach(key => this.store.delete(key));
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.store.forEach((entry, key) => {
      // Remove entries where all requests are outside the window
      const windowStart = now - (5 * 60 * 1000); // 5 minutes ago
      entry.requests = entry.requests.filter(timestamp => timestamp > windowStart);
      
      if (entry.requests.length === 0) {
        keysToDelete.push(key);
      } else {
        entry.count = entry.requests.length;
      }
    });

    keysToDelete.forEach(key => this.store.delete(key));
    
    if (keysToDelete.length > 0) {
      console.log(`[RateLimiter] Cleaned up ${keysToDelete.length} expired entries`);
    }
  }

  /**
   * Get statistics about current rate limiting
   */
  getStats(): {
    totalEntries: number;
    totalRequests: number;
    topIdentifiers: Array<{ identifier: string; requests: number }>;
  } {
    const identifierCounts = new Map<string, number>();
    let totalRequests = 0;

    this.store.forEach((entry, key) => {
      const identifier = key.split(':')[0];
      const currentCount = identifierCounts.get(identifier) || 0;
      identifierCounts.set(identifier, currentCount + entry.count);
      totalRequests += entry.count;
    });

    const topIdentifiers = Array.from(identifierCounts.entries())
      .map(([identifier, requests]) => ({ identifier, requests }))
      .sort((a, b) => b.requests - a.requests)
      .slice(0, 10);

    return {
      totalEntries: this.store.size,
      totalRequests,
      topIdentifiers
    };
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
  }
}

// Create singleton instance
export const rateLimiter = new RateLimiter();

// Export types for use in other modules
export type { RateLimitConfig, RateLimitResult };

// Predefined rate limit configurations
export const RATE_LIMIT_PRESETS = {
  // Very strict - for sensitive operations
  STRICT: { requests: 5, window: 60000 }, // 5 per minute
  
  // Conservative - for write operations
  CONSERVATIVE: { requests: 20, window: 60000 }, // 20 per minute
  
  // Standard - for general API usage
  STANDARD: { requests: 100, window: 60000 }, // 100 per minute
  
  // Generous - for read operations
  GENEROUS: { requests: 500, window: 60000 }, // 500 per minute
  
  // Burst - for batch operations
  BURST: { requests: 1000, window: 300000 }, // 1000 per 5 minutes
} as const;

/**
 * Helper function to get client identifier from request
 */
export function getClientIdentifier(request: Request): string {
  // Try to get real IP from headers (for production with proxies)
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  if (realIp) {
    return realIp;
  }
  
  // Fallback to a default identifier
  return 'unknown';
}

/**
 * Middleware function for rate limiting
 */
export function withRateLimit(
  config: RateLimitConfig,
  endpoint: string
) {
  return async function rateLimitMiddleware(
    request: Request,
    handler: Function
  ): Promise<Response> {
    const clientId = getClientIdentifier(request);
    const result = await rateLimiter.checkLimit(clientId, endpoint, config);
    
    if (!result.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          retryAfter: result.retryAfter
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': result.retryAfter?.toString() || '60',
            'X-RateLimit-Remaining': '0'
          }
        }
      );
    }

    // Add rate limit headers to the response
    const response = await handler(request);
    
    if (response instanceof Response) {
      response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
    }
    
    return response;
  };
}