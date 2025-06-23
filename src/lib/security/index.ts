/**
 * Security Utilities Module
 * Comprehensive security implementation for Train Station Dashboard
 */

import DOMPurify from 'dompurify';
import { z } from 'zod';

// Security configuration (CSP removed for development flexibility)
export interface SecurityConfig {
  enableCSRF: boolean;
  enableXSSProtection: boolean;
  enableSQLInjectionProtection: boolean;
  maxFileSize: number;
  allowedFileTypes: string[];
}

export const defaultSecurityConfig: SecurityConfig = {
  enableCSRF: true,
  enableXSSProtection: true,
  enableSQLInjectionProtection: true,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedFileTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
};

// Input Sanitization
export class InputSanitizer {
  private config: SecurityConfig;

  constructor(config: SecurityConfig = defaultSecurityConfig) {
    this.config = config;
  }

  /**
   * Sanitize text input to prevent XSS
   */
  sanitizeText(input: string): string {
    if (!this.config.enableXSSProtection) return input;
    
    return DOMPurify.sanitize(input, { 
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: []
    });
  }

  /**
   * Sanitize HTML content with limited allowed tags
   */
  sanitizeHTML(input: string, allowedTags?: string[]): string {
    if (!this.config.enableXSSProtection) return input;

    const tags = allowedTags || ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
    
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: tags,
      ALLOWED_ATTR: ['class', 'id'],
      FORBID_ATTR: ['style', 'onerror', 'onload', 'onclick'],
      FORBID_TAGS: ['script', 'object', 'embed', 'iframe', 'form', 'input', 'button']
    });
  }

  /**
   * Sanitize email input
   */
  sanitizeEmail(input: string): string {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const sanitized = this.sanitizeText(input.toLowerCase().trim());
    
    if (!emailRegex.test(sanitized)) {
      throw new Error('Invalid email format');
    }
    
    return sanitized;
  }

  /**
   * Sanitize URL input
   */
  sanitizeURL(input: string): string {
    const sanitized = this.sanitizeText(input.trim());
    
    try {
      const url = new URL(sanitized);
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('Invalid URL protocol');
      }
      return url.toString();
    } catch {
      throw new Error('Invalid URL format');
    }
  }

  /**
   * Sanitize filename for file uploads
   */
  sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9\-_\.]/g, '_')
      .replace(/\.+/g, '.')
      .replace(/^\.+|\.+$/g, '')
      .substring(0, 255);
  }

  /**
   * Validate and sanitize SQL query parameters
   */
  sanitizeSQLParameter(input: any): any {
    if (!this.config.enableSQLInjectionProtection) return input;

    if (typeof input === 'string') {
      // Remove potential SQL injection patterns
      const dangerous = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
        /('|('')|"|;|%|_|\*|\?|<|>|\|)/g,
        /(--|\*\/|\/\*)/g
      ];

      let sanitized = input;
      dangerous.forEach(pattern => {
        sanitized = sanitized.replace(pattern, '');
      });

      return sanitized;
    }

    return input;
  }

  /**
   * Comprehensive input validation schema
   */
  createValidationSchema() {
    return {
      text: z.string().max(5000).transform(input => this.sanitizeText(input)),
      html: z.string().max(10000).transform(input => this.sanitizeHTML(input)),
      email: z.string().email().transform(input => this.sanitizeEmail(input)),
      url: z.string().url().transform(input => this.sanitizeURL(input)),
      filename: z.string().max(255).transform(input => this.sanitizeFilename(input)),
      sqlParam: z.any().transform(input => this.sanitizeSQLParameter(input))
    };
  }
}

// CSRF Protection
export class CSRFProtection {
  private tokens = new Map<string, { token: string; expires: number; used: boolean }>();
  private readonly tokenExpiry = 60 * 60 * 1000; // 1 hour

  /**
   * Generate CSRF token
   */
  generateToken(sessionId: string): string {
    const token = this.generateSecureToken();
    const expires = Date.now() + this.tokenExpiry;
    
    this.tokens.set(sessionId, { token, expires, used: false });
    return token;
  }

  /**
   * Validate CSRF token
   */
  validateToken(sessionId: string, providedToken: string): boolean {
    const tokenData = this.tokens.get(sessionId);
    
    if (!tokenData) return false;
    if (tokenData.used) return false;
    if (Date.now() > tokenData.expires) {
      this.tokens.delete(sessionId);
      return false;
    }
    if (tokenData.token !== providedToken) return false;

    // Mark token as used (one-time use)
    tokenData.used = true;
    return true;
  }

  /**
   * Cleanup expired tokens
   */
  cleanup(): void {
    const now = Date.now();
    for (const [sessionId, tokenData] of this.tokens.entries()) {
      if (now > tokenData.expires || tokenData.used) {
        this.tokens.delete(sessionId);
      }
    }
  }

  private generateSecureToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
}

// Security Headers
export class SecurityHeaders {
  private config: SecurityConfig;

  constructor(config: SecurityConfig = defaultSecurityConfig) {
    this.config = config;
  }

  /**
   * Generate all security headers (CSP removed for development flexibility)
   */
  getHeaders(): Record<string, string> {
    return {
      ...this.getXSSHeaders(),
      ...this.getFrameHeaders(),
      ...this.getContentTypeHeaders(),
      ...this.getHSTSHeaders(),
      ...this.getReferrerHeaders(),
      ...this.getPermissionHeaders()
    };
  }



  private getXSSHeaders(): Record<string, string> {
    return {
      'X-XSS-Protection': '1; mode=block',
      'X-Content-Type-Options': 'nosniff'
    };
  }

  private getFrameHeaders(): Record<string, string> {
    return {
      'X-Frame-Options': 'DENY'
    };
  }

  private getContentTypeHeaders(): Record<string, string> {
    return {
      'X-Content-Type-Options': 'nosniff'
    };
  }

  private getHSTSHeaders(): Record<string, string> {
    return {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
    };
  }

  private getReferrerHeaders(): Record<string, string> {
    return {
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    };
  }

  private getPermissionHeaders(): Record<string, string> {
    return {
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()'
    };
  }
}

// File Upload Security
export class FileUploadSecurity {
  private config: SecurityConfig;

  constructor(config: SecurityConfig = defaultSecurityConfig) {
    this.config = config;
  }

  /**
   * Validate file upload
   */
  validateFile(file: { name: string; type: string; size: number; content?: ArrayBuffer }): {
    valid: boolean;
    errors: string[];
    sanitizedName?: string;
  } {
    const errors: string[] = [];

    // Check file size
    if (file.size > this.config.maxFileSize) {
      errors.push(`File size exceeds maximum limit of ${this.config.maxFileSize / (1024 * 1024)}MB`);
    }

    // Check file type
    if (!this.config.allowedFileTypes.includes(file.type)) {
      errors.push(`File type ${file.type} is not allowed`);
    }

    // Validate filename
    const sanitizer = new InputSanitizer(this.config);
    const sanitizedName = sanitizer.sanitizeFilename(file.name);

    // Check for dangerous file extensions
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.com', '.pif', '.vbs', '.js', '.jar'];
    const hasExtension = dangerousExtensions.some(ext => 
      sanitizedName.toLowerCase().endsWith(ext)
    );

    if (hasExtension) {
      errors.push('File extension is not allowed');
    }

    // Check file content if provided
    if (file.content) {
      const scanErrors = this.scanFileContent(file.content);
      scanErrors.forEach(error => errors.push(error));
    }

    return {
      valid: errors.length === 0,
      errors,
      sanitizedName: errors.length === 0 ? sanitizedName : undefined
    };
  }

  private scanFileContent(content: ArrayBuffer): string[] {
    const errors: string[] = [];
    const bytes = new Uint8Array(content);
    
    // Check for executable file signatures
    const signatures = [
      [0x4D, 0x5A], // PE executable
      [0x7F, 0x45, 0x4C, 0x46], // ELF executable
      [0xCA, 0xFE, 0xBA, 0xBE], // Java class file
      [0xFE, 0xED, 0xFA, 0xCE], // Mach-O executable
    ];

    for (const signature of signatures) {
      if (this.matchesSignature(bytes, signature)) {
        errors.push('File contains executable code');
        break;
      }
    }

    return errors;
  }

  private matchesSignature(bytes: Uint8Array, signature: number[]): boolean {
    if (bytes.length < signature.length) return false;
    
    for (let i = 0; i < signature.length; i++) {
      if (bytes[i] !== signature[i]) return false;
    }
    
    return true;
  }
}

// Session Security
export class SessionSecurity {
  private readonly maxSessionAge = 24 * 60 * 60 * 1000; // 24 hours
  private readonly maxIdleTime = 2 * 60 * 60 * 1000; // 2 hours
  private sessions = new Map<string, {
    userId: string;
    created: number;
    lastActivity: number;
    ipAddress: string;
    userAgent: string;
  }>();

  /**
   * Create secure session
   */
  createSession(userId: string, ipAddress: string, userAgent: string): string {
    const sessionId = this.generateSecureSessionId();
    const now = Date.now();

    this.sessions.set(sessionId, {
      userId,
      created: now,
      lastActivity: now,
      ipAddress,
      userAgent
    });

    return sessionId;
  }

  /**
   * Validate session
   */
  validateSession(sessionId: string, ipAddress: string, userAgent: string): {
    valid: boolean;
    userId?: string;
    reason?: string;
  } {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return { valid: false, reason: 'Session not found' };
    }

    const now = Date.now();

    // Check session age
    if (now - session.created > this.maxSessionAge) {
      this.sessions.delete(sessionId);
      return { valid: false, reason: 'Session expired' };
    }

    // Check idle time
    if (now - session.lastActivity > this.maxIdleTime) {
      this.sessions.delete(sessionId);
      return { valid: false, reason: 'Session idle timeout' };
    }

    // Check IP consistency (optional security measure)
    if (session.ipAddress !== ipAddress) {
      this.sessions.delete(sessionId);
      return { valid: false, reason: 'IP address mismatch' };
    }

    // Update activity
    session.lastActivity = now;

    return { valid: true, userId: session.userId };
  }

  /**
   * Destroy session
   */
  destroySession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  /**
   * Cleanup expired sessions
   */
  cleanup(): void {
    const now = Date.now();
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.created > this.maxSessionAge || 
          now - session.lastActivity > this.maxIdleTime) {
        this.sessions.delete(sessionId);
      }
    }
  }

  private generateSecureSessionId(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
}

// Security Middleware
export const createSecurityMiddleware = (config: SecurityConfig = defaultSecurityConfig) => {
  const sanitizer = new InputSanitizer(config);
  const csrfProtection = new CSRFProtection();
  const securityHeaders = new SecurityHeaders(config);
  const fileUploadSecurity = new FileUploadSecurity(config);
  const sessionSecurity = new SessionSecurity();

  return {
    sanitizer,
    csrfProtection,
    securityHeaders,
    fileUploadSecurity,
    sessionSecurity,

    // Middleware function for request processing
    processRequest: async (request: Request): Promise<{
      sanitizedBody?: any;
      securityHeaders: Record<string, string>;
      csrfToken?: string;
      errors: string[];
    }> => {
      const errors: string[] = [];
      const headers = securityHeaders.getHeaders();

      let sanitizedBody;
      let csrfToken;

      // Process body if present
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        try {
          const body = await request.json();
          sanitizedBody = sanitizer.sanitizeSQLParameter(body);
          
          // Generate CSRF token if needed
          const sessionId = request.headers.get('X-Session-ID');
          if (sessionId && config.enableCSRF) {
            csrfToken = csrfProtection.generateToken(sessionId);
          }
        } catch (error) {
          errors.push('Invalid request body');
        }
      }

      return {
        sanitizedBody,
        securityHeaders: headers,
        csrfToken,
        errors
      };
    }
  };
};

// Export singleton instances
export const defaultSanitizer = new InputSanitizer();
export const defaultCSRFProtection = new CSRFProtection();
export const defaultSecurityHeaders = new SecurityHeaders();
export const defaultFileUploadSecurity = new FileUploadSecurity();
export const defaultSessionSecurity = new SessionSecurity();

// Export security middleware
export { SecurityMiddleware, securityMiddleware, useSecurityMiddleware } from './middleware';

// Cleanup scheduler
if (typeof window === 'undefined') {
  // Server-side cleanup
  setInterval(() => {
    defaultCSRFProtection.cleanup();
    defaultSessionSecurity.cleanup();
  }, 15 * 60 * 1000); // Every 15 minutes
} 