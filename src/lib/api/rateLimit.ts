/**
 * Rate Limiting System
 * Implements flexible rate limiting for Train Station Dashboard API
 */
import { decodeJwt } from 'jose';

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator: (request: Request) => string | Promise<string>;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  message?: string;
  standardHeaders?: boolean;
  legacyHeaders?: boolean;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

export interface RateLimitBypass {
  apiKeys: string[];
  ipAddresses: string[];
  userRoles: string[];
}

// In-memory store for rate limiting (in production, use Redis)
class MemoryStore {
  private hits = new Map<string, { count: number; resetTime: number }>();

  async increment(key: string, windowMs: number): Promise<{ count: number; resetTime: number }> {
    const now = Date.now();
    const resetTime = now + windowMs;
    
    const current = this.hits.get(key);
    
    if (!current || now > current.resetTime) {
      const newHit = { count: 1, resetTime };
      this.hits.set(key, newHit);
      return newHit;
    }
    
    current.count++;
    this.hits.set(key, current);
    return current;
  }

  async get(key: string): Promise<{ count: number; resetTime: number } | undefined> {
    const hit = this.hits.get(key);
    if (hit && Date.now() > hit.resetTime) {
      this.hits.delete(key);
      return undefined;
    }
    return hit;
  }

  async reset(key: string): Promise<void> {
    this.hits.delete(key);
  }

  // Cleanup expired entries periodically
  cleanup(): void {
    const now = Date.now();
    for (const [key, hit] of this.hits.entries()) {
      if (now > hit.resetTime) {
        this.hits.delete(key);
      }
    }
  }
}

// Global store instance
const store = new MemoryStore();

// Cleanup expired entries every 5 minutes
setInterval(() => store.cleanup(), 5 * 60 * 1000);

export class RateLimiter {
  private config: RateLimitConfig;
  private bypass: RateLimitBypass;

  constructor(config: RateLimitConfig, bypass: RateLimitBypass = { apiKeys: [], ipAddresses: [], userRoles: [] }) {
    this.config = {
      standardHeaders: true,
      legacyHeaders: false,
      message: 'Too many requests, please try again later.',
      ...config
    };
    this.bypass = bypass;
  }

  async check(request: Request): Promise<{ allowed: boolean; info: RateLimitInfo; headers: Record<string, string> }> {
    // Check if request should bypass rate limiting
    if (await this.shouldBypass(request)) {
      return {
        allowed: true,
        info: { limit: Infinity, remaining: Infinity, reset: 0 },
        headers: {}
      };
    }

    const key = await this.config.keyGenerator(request);
    const hit = await store.increment(key, this.config.windowMs);
    
    const remaining = Math.max(0, this.config.maxRequests - hit.count);
    const resetTime = Math.ceil(hit.resetTime / 1000);
    
    const info: RateLimitInfo = {
      limit: this.config.maxRequests,
      remaining,
      reset: resetTime
    };

    const headers = this.buildHeaders(info);
    
    if (hit.count > this.config.maxRequests) {
      info.retryAfter = Math.ceil((hit.resetTime - Date.now()) / 1000);
      headers['Retry-After'] = info.retryAfter.toString();
      
      return { allowed: false, info, headers };
    }

    return { allowed: true, info, headers };
  }

  private async shouldBypass(request: Request): Promise<boolean> {
    // Check API key bypass
    const apiKey = request.headers.get('X-API-Key');
    if (apiKey && this.bypass.apiKeys.includes(apiKey)) {
      return true;
    }

    // Check IP whitelist
    const clientIp = this.getClientIp(request);
    if (this.bypass.ipAddresses.includes(clientIp)) {
      return true;
    }

    // Check user role (would need to be implemented based on auth system)
    // const userRole = await this.getUserRole(request);
    // if (userRole && this.bypass.userRoles.includes(userRole)) {
    //   return true;
    // }

    return false;
  }

  private getClientIp(request: Request): string {
    // Try multiple headers for client IP
    const headers = [
      'x-forwarded-for',
      'x-real-ip',
      'x-client-ip',
      'cf-connecting-ip'
    ];

    for (const header of headers) {
      const value = request.headers.get(header);
      if (value) {
        // Handle comma-separated IPs (take the first one)
        return value.split(',')[0].trim();
      }
    }

    return 'unknown';
  }

  private buildHeaders(info: RateLimitInfo): Record<string, string> {
    const headers: Record<string, string> = {};

    if (this.config.standardHeaders) {
      headers['X-RateLimit-Limit'] = info.limit.toString();
      headers['X-RateLimit-Remaining'] = info.remaining.toString();
      headers['X-RateLimit-Reset'] = info.reset.toString();
    }

    if (this.config.legacyHeaders) {
      headers['X-Rate-Limit-Limit'] = info.limit.toString();
      headers['X-Rate-Limit-Remaining'] = info.remaining.toString();
      headers['X-Rate-Limit-Reset'] = info.reset.toString();
    }

    return headers;
  }
}

// Key generators for different scenarios
export const keyGenerators = {
  ip: (request: Request) => {
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    return ip.split(',')[0].trim();
  },

  user: async (request: Request) => {
    // This would integrate with your auth system
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return keyGenerators.ip(request);
    }

    // Extract user ID from JWT using a proper library
    try {
      const token = authHeader.substring(7);
      const payload = decodeJwt(token);
      const userId = typeof payload.sub === 'string' ? payload.sub : undefined;
      return userId ? `user:${userId}` : keyGenerators.ip(request);
    } catch {
      return keyGenerators.ip(request);
    }
  },

  apiKey: (request: Request) => {
    const apiKey = request.headers.get('X-API-Key');
    return apiKey ? `api:${apiKey}` : keyGenerators.ip(request);
  },

  composite: (request: Request) => {
    const ip = keyGenerators.ip(request);
    const userAgent = request.headers.get('User-Agent') || 'unknown';
    const hash = userAgent.substring(0, 10); // Simplified hash
    return `${ip}:${hash}`;
  }
};

// Predefined rate limit configurations
export const rateLimitConfigs = {
  // General API endpoints
  default: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 1000,
    keyGenerator: keyGenerators.ip,
    message: 'Too many requests from this IP, please try again later.'
  },

  // Authentication endpoints (stricter)
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    keyGenerator: keyGenerators.ip,
    message: 'Too many authentication attempts, please try again later.'
  },

  // Search endpoints
  search: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    keyGenerator: keyGenerators.user,
    message: 'Search rate limit exceeded, please slow down.'
  },

  // File upload endpoints
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 50,
    keyGenerator: keyGenerators.user,
    message: 'Upload limit exceeded for this hour.'
  },

  // API key endpoints (higher limits)
  apiKey: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 1000,
    keyGenerator: keyGenerators.apiKey,
    message: 'API key rate limit exceeded.'
  },

  // Public endpoints (more restrictive)
  public: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    keyGenerator: keyGenerators.composite,
    message: 'Public API rate limit exceeded.'
  },

  // Critical operations (very restrictive)
  critical: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
    keyGenerator: keyGenerators.user,
    message: 'Critical operation rate limit exceeded.'
  }
};

// Create rate limiter instances
export const createRateLimiter = (type: keyof typeof rateLimitConfigs, customConfig?: Partial<RateLimitConfig>) => {
  const config = { ...rateLimitConfigs[type], ...customConfig };
  return new RateLimiter(config);
};

// Express/Edge function middleware wrapper
export const rateLimitMiddleware = (limiter: RateLimiter) => {
  return async (request: Request): Promise<Response | null> => {
    const result = await limiter.check(request);
    
    if (!result.allowed) {
      return new Response(
        JSON.stringify({
          type: 'https://docs.trainstation-dashboard.com/errors/rate-limit-exceeded',
          title: 'Rate Limit Exceeded',
          status: 429,
          detail: limiter['config'].message,
          instance: new URL(request.url).pathname,
          timestamp: new Date().toISOString(),
          retryAfter: result.info.retryAfter
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...result.headers
          }
        }
      );
    }

    // Add rate limit headers to successful responses (handled by calling code)
    return null;
  };
};

// Utility functions
export const resetRateLimit = async (key: string): Promise<void> => {
  await store.reset(key);
};

export const getRateLimitStatus = async (key: string): Promise<{ count: number; resetTime: number } | undefined> => {
  return await store.get(key);
};

// Advanced rate limiting strategies
export class SlidingWindowRateLimiter {
  private windowSize: number;
  private maxRequests: number;
  private requests = new Map<string, number[]>();

  constructor(windowSize: number, maxRequests: number) {
    this.windowSize = windowSize;
    this.maxRequests = maxRequests;
  }

  async check(key: string): Promise<{ allowed: boolean; remaining: number }> {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Remove requests outside the window
    const validRequests = requests.filter(time => now - time < this.windowSize);
    
    if (validRequests.length >= this.maxRequests) {
      this.requests.set(key, validRequests);
      return { allowed: false, remaining: 0 };
    }

    // Add current request
    validRequests.push(now);
    this.requests.set(key, validRequests);
    
    return { 
      allowed: true, 
      remaining: this.maxRequests - validRequests.length 
    };
  }
}

export class TokenBucketRateLimiter {
  private capacity: number;
  private tokensPerSecond: number;
  private buckets = new Map<string, { tokens: number; lastRefill: number }>();

  constructor(capacity: number, tokensPerSecond: number) {
    this.capacity = capacity;
    this.tokensPerSecond = tokensPerSecond;
  }

  async check(key: string): Promise<{ allowed: boolean; tokens: number }> {
    const now = Date.now() / 1000;
    const bucket = this.buckets.get(key) || { tokens: this.capacity, lastRefill: now };
    
    // Refill tokens
    const tokensToAdd = Math.floor((now - bucket.lastRefill) * this.tokensPerSecond);
    bucket.tokens = Math.min(this.capacity, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
    
    if (bucket.tokens < 1) {
      this.buckets.set(key, bucket);
      return { allowed: false, tokens: bucket.tokens };
    }

    bucket.tokens--;
    this.buckets.set(key, bucket);
    return { allowed: true, tokens: bucket.tokens };
  }
} 