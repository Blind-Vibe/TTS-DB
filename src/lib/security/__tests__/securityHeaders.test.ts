import { describe, it, expect } from 'vitest';
import { SecurityHeaders } from '../index';

describe('SecurityHeaders', () => {
  const headers = new SecurityHeaders();

  it('returns expected header fields', () => {
    const result = headers.getHeaders();
    expect(result['X-Frame-Options']).toBe('DENY');
    expect(result['X-Content-Type-Options']).toBe('nosniff');
    expect(result['X-XSS-Protection']).toBe('1; mode=block');
    expect(result['Strict-Transport-Security']).toContain('max-age');
    expect(result['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    expect(result['Permissions-Policy']).toContain('camera=()');
  });

  it('does not include CSP header by default', () => {
    const result = headers.getHeaders();
    expect(result['Content-Security-Policy']).toBeUndefined();
  });
});
