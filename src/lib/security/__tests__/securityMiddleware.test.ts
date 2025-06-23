/**
 * Security Middleware Test Suite
 * Comprehensive tests for all security features implemented in Task 137
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SecurityMiddleware, useSecurityMiddleware } from '../middleware';
import { securityMiddleware } from '../middleware';

// Mock DOM Purify and other dependencies
vi.mock('dompurify', () => ({
  default: {
    sanitize: vi.fn((input: string, options?: any) => {
      // Simple mock sanitization - removes script tags
      if (options?.ALLOWED_TAGS?.length === 0) {
        return input.replace(/<script[^>]*>.*?<\/script>/gi, '');
      }
      return input;
    })
  }
}));

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'mocked-uuid-12345'),
    getRandomValues: vi.fn((array: Uint8Array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    })
  }
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock fetch
global.fetch = vi.fn();

describe('SecurityMiddleware', () => {
  let middleware: SecurityMiddleware;

  beforeEach(() => {
    middleware = new SecurityMiddleware();
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Configuration', () => {
    it('should initialize with default configuration', () => {
      const defaultMiddleware = new SecurityMiddleware();
      const headers = defaultMiddleware.applySecurityHeaders();
      
      expect(headers).toHaveProperty('Strict-Transport-Security');
      expect(headers).toHaveProperty('X-Frame-Options');
      expect(headers).not.toHaveProperty('Content-Security-Policy');
    });

    it('should allow custom configuration', () => {
      const customMiddleware = new SecurityMiddleware({
        enableCSRF: false,
        enableSecurityHeaders: false,
        enableInputSanitization: false
      });

      const headers = customMiddleware.applySecurityHeaders();
      const csrfToken = customMiddleware.generateCSRFToken('test-session');
      
      expect(Object.keys(headers)).toHaveLength(0);
      expect(csrfToken).toBe('');
    });
  });

  describe('Security Headers', () => {
    it('should generate comprehensive security headers', () => {
      const headers = middleware.applySecurityHeaders();

      expect(headers).toHaveProperty('Strict-Transport-Security');
      expect(headers).toHaveProperty('X-Frame-Options', 'DENY');
      expect(headers).toHaveProperty('X-Content-Type-Options', 'nosniff');
      expect(headers).toHaveProperty('X-XSS-Protection', '1; mode=block');
      expect(headers).toHaveProperty('Referrer-Policy', 'strict-origin-when-cross-origin');
      expect(headers).toHaveProperty('Permissions-Policy');
      expect(headers).not.toHaveProperty('Content-Security-Policy');
    });

    it('should omit CSP header in development', () => {
      const headers = middleware.applySecurityHeaders();
      expect(headers['Content-Security-Policy']).toBeUndefined();
    });

    it('should include HSTS with proper configuration', () => {
      const headers = middleware.applySecurityHeaders();
      const hsts = headers['Strict-Transport-Security'];

      expect(hsts).toContain('max-age=31536000');
      expect(hsts).toContain('includeSubDomains');
      expect(hsts).toContain('preload');
    });
  });

  describe('Input Sanitization', () => {
    it('should sanitize form data objects', () => {
      const formData = {
        username: '<script>alert("xss")</script>user123',
        email: 'test@example.com',
        nested: {
          field: '<script>malicious()</script>value'
        }
      };

      const sanitized = middleware.sanitizeFormData(formData);

      expect(sanitized.username).not.toContain('<script>');
      expect(sanitized.email).toBe('test@example.com');
      expect(sanitized.nested.field).not.toContain('<script>');
    });

    it('should sanitize FormData instances', () => {
      const formData = new FormData();
      formData.append('field1', '<script>alert("xss")</script>value');
      formData.append('field2', 'safe-value');

      const sanitized = middleware.sanitizeFormData(formData);

      expect(sanitized.field1).not.toContain('<script>');
      expect(sanitized.field2).toBe('safe-value');
    });

    it('should handle non-string values in objects', () => {
      const formData = {
        stringField: '<script>alert("xss")</script>text',
        numberField: 123,
        booleanField: true,
        nullField: null,
        undefinedField: undefined
      };

      const sanitized = middleware.sanitizeFormData(formData);

      expect(sanitized.stringField).not.toContain('<script>');
      expect(sanitized.numberField).toBe(123);
      expect(sanitized.booleanField).toBe(true);
      expect(sanitized.nullField).toBe(null);
      expect(sanitized.undefinedField).toBe(undefined);
    });

    it('should return unsanitized data when sanitization is disabled', () => {
      const disabledMiddleware = new SecurityMiddleware({
        enableInputSanitization: false,
        enableCSRF: true,
        enableSecurityHeaders: true
      });

      const formData = {
        maliciousField: '<script>alert("xss")</script>text'
      };

      const result = disabledMiddleware.sanitizeFormData(formData);
      expect(result.maliciousField).toContain('<script>');
    });
  });

  describe('CSRF Protection', () => {
    it('should generate CSRF tokens', () => {
      const sessionId = 'test-session-123';
      const token = middleware.generateCSRFToken(sessionId);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should validate CSRF tokens', () => {
      const sessionId = 'test-session-123';
      const token = middleware.generateCSRFToken(sessionId);

      const isValid = middleware.validateCSRFToken(sessionId, token);
      expect(isValid).toBe(true);
    });

    it('should reject invalid CSRF tokens', () => {
      const sessionId = 'test-session-123';
      middleware.generateCSRFToken(sessionId);

      const isValid = middleware.validateCSRFToken(sessionId, 'invalid-token');
      expect(isValid).toBe(false);
    });

    it('should reject tokens for different sessions', () => {
      const sessionId1 = 'test-session-1';
      const sessionId2 = 'test-session-2';
      const token = middleware.generateCSRFToken(sessionId1);

      const isValid = middleware.validateCSRFToken(sessionId2, token);
      expect(isValid).toBe(false);
    });

    it('should return empty token when CSRF is disabled', () => {
      const disabledMiddleware = new SecurityMiddleware({
        enableCSRF: false,
        enableSecurityHeaders: true,
        enableInputSanitization: true
      });

      const token = disabledMiddleware.generateCSRFToken('test-session');
      expect(token).toBe('');
    });

    it('should always validate as true when CSRF is disabled', () => {
      const disabledMiddleware = new SecurityMiddleware({
        enableCSRF: false,
        enableSecurityHeaders: true,
        enableInputSanitization: true
      });

      const isValid = disabledMiddleware.validateCSRFToken('session', 'any-token');
      expect(isValid).toBe(true);
    });
  });

  describe('File Upload Validation', () => {
    it('should validate allowed file types', () => {
      const validFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const validation = middleware.validateFileUpload(validFile);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should reject disallowed file types', () => {
      const invalidFile = new File(['content'], 'malware.exe', { type: 'application/x-executable' });
      const validation = middleware.validateFileUpload(invalidFile);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('File type application/x-executable is not allowed');
    });

    it('should reject files exceeding size limit', () => {
      const largeFile = new File([new ArrayBuffer(11 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
      const validation = middleware.validateFileUpload(largeFile);

      expect(validation.valid).toBe(false);
      expect(validation.errors.some(error => error.includes('size exceeds maximum limit'))).toBe(true);
    });

    it('should reject dangerous file extensions', () => {
      const dangerousFile = new File(['content'], 'malware.exe', { type: 'image/jpeg' }); // Spoofed type
      const validation = middleware.validateFileUpload(dangerousFile);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('File extension is not allowed for security reasons');
    });

    it('should validate multiple criteria simultaneously', () => {
      const multipleIssuesFile = new File(
        [new ArrayBuffer(11 * 1024 * 1024)], 
        'large-malware.exe', 
        { type: 'application/x-executable' }
      );
      const validation = middleware.validateFileUpload(multipleIssuesFile);

      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(1);
    });
  });

  describe('Secure Fetch', () => {
    beforeEach(() => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });
    });

    it('should add security headers to requests', async () => {
      await middleware.secureFetch('https://api.example.com/data');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/data',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Strict-Transport-Security': expect.any(String),
            'X-Frame-Options': 'DENY'
          })
        })
      );
    });

    it('should add CSRF tokens to state-changing requests', async () => {
      localStorageMock.getItem.mockReturnValue('test-session-id');

      await middleware.secureFetch('https://api.example.com/data', {
        method: 'POST',
        body: JSON.stringify({ data: 'test' })
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/data',
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-CSRF-Token': expect.any(String)
          })
        })
      );
    });

    it('should sanitize JSON request bodies', async () => {
      const maliciousData = {
        username: '<script>alert("xss")</script>user',
        comment: 'Safe comment'
      };

      await middleware.secureFetch('https://api.example.com/data', {
        method: 'POST',
        body: JSON.stringify(maliciousData)
      });

      const fetchCall = (global.fetch as any).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      
      expect(requestBody.username).not.toContain('<script>');
      expect(requestBody.comment).toBe('Safe comment');
    });

    it('should handle non-JSON request bodies', async () => {
      const formData = new FormData();
      formData.append('file', 'binary-data');

      await middleware.secureFetch('https://api.example.com/upload', {
        method: 'POST',
        body: formData
      });

      const fetchCall = (global.fetch as any).mock.calls[0];
      expect(fetchCall[1].body).toBeInstanceOf(FormData);
    });

    it('should not add CSRF tokens to GET requests', async () => {
      await middleware.secureFetch('https://api.example.com/data', {
        method: 'GET'
      });

      const fetchCall = (global.fetch as any).mock.calls[0];
      expect(fetchCall[1].headers).not.toHaveProperty('X-CSRF-Token');
    });
  });

  describe('URL Parameter Sanitization', () => {
    it('should sanitize URL parameters', () => {
      const params = new URLSearchParams();
      params.append('q', '<script>alert("xss")</script>search');
      params.append('page', '1');
      params.append('sort', 'name');

      const sanitized = middleware.sanitizeURLParams(params);

      expect(sanitized.get('q')).not.toContain('<script>');
      expect(sanitized.get('page')).toBe('1');
      expect(sanitized.get('sort')).toBe('name');
    });

    it('should handle empty parameters', () => {
      const params = new URLSearchParams();
      const sanitized = middleware.sanitizeURLParams(params);

      expect(sanitized.toString()).toBe('');
    });

    it('should sanitize parameter keys as well as values', () => {
      const params = new URLSearchParams();
      params.append('<script>key</script>', '<script>value</script>');

      const sanitized = middleware.sanitizeURLParams(params);
      const entries = Array.from(sanitized.entries());

      expect(entries[0][0]).not.toContain('<script>');
      expect(entries[0][1]).not.toContain('<script>');
    });
  });

  describe('Session Management', () => {
    it('should generate session IDs when none exists', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      await middleware.secureFetch('https://api.example.com/data', {
        method: 'POST',
        body: '{}'
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith('session-id', 'mocked-uuid-12345');
    });

    it('should use existing session IDs', () => {
      localStorageMock.getItem.mockReturnValue('existing-session-id');
      
      const token = middleware.generateCSRFToken('any-session');
      
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('should handle server-side environment', () => {
      // Mock server environment
      const originalWindow = global.window;
      delete (global as any).window;

      const serverMiddleware = new SecurityMiddleware();
      const token = serverMiddleware.generateCSRFToken('test-session');

      expect(token).toBeDefined();

      // Restore window
      global.window = originalWindow;
    });
  });

  describe('Response Headers', () => {
    it('should create secure response headers', () => {
      const headers = middleware.createSecureResponseHeaders();

      expect(headers.get('Content-Security-Policy')).toBeNull();
      expect(headers.get('Strict-Transport-Security')).toBeDefined();
      expect(headers.get('X-Frame-Options')).toBe('DENY');
      expect(headers.get('X-Content-Type-Options')).toBe('nosniff');
    });

    it('should return Headers instance', () => {
      const headers = middleware.createSecureResponseHeaders();
      expect(headers).toBeInstanceOf(Headers);
    });
  });

  describe('React Hook Integration', () => {
    it('should provide useSecurityMiddleware hook', () => {
      const hookResult = useSecurityMiddleware();
      expect(hookResult).toBe(securityMiddleware);
    });

    it('should return singleton instance', () => {
      const instance1 = useSecurityMiddleware();
      const instance2 = useSecurityMiddleware();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON in secure fetch', async () => {
      await expect(
        middleware.secureFetch('https://api.example.com/data', {
          method: 'POST',
          body: 'invalid-json'
        })
      ).resolves.toBeDefined();
    });

    it('should handle fetch errors gracefully', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      await expect(
        middleware.secureFetch('https://api.example.com/data')
      ).rejects.toThrow('Network error');
    });

    it('should handle HTTP error responses', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({ error: 'Not found' })
      });

      const response = await middleware.secureFetch('https://api.example.com/data');
      expect(response.ok).toBe(false);
    });
  });

  describe('Security Best Practices', () => {
    it('should implement defense in depth', () => {
      const headers = middleware.applySecurityHeaders();
      
      // Multiple layers of XSS protection
      expect(headers).toHaveProperty('X-XSS-Protection');
      expect(headers).toHaveProperty('X-Content-Type-Options');
    });

    it('should follow principle of least privilege', () => {
      const headers = middleware.applySecurityHeaders();
      const permissionsPolicy = headers['Permissions-Policy'];
      
      expect(permissionsPolicy).toContain('camera=()');
      expect(permissionsPolicy).toContain('microphone=()');
      expect(permissionsPolicy).toContain('geolocation=()');
      expect(permissionsPolicy).toContain('payment=()');
    });

    it('should enforce secure transport', () => {
      const headers = middleware.applySecurityHeaders();
      const hsts = headers['Strict-Transport-Security'];
      
      expect(hsts).toContain('max-age=31536000');
      expect(hsts).toContain('includeSubDomains');
      expect(hsts).toContain('preload');
    });
  });
}); 