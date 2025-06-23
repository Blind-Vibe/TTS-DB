import { describe, it, expect, vi } from 'vitest';

vi.mock('dompurify', () => ({
  default: { sanitize: (s: string) => s.replace(/<script[^>]*>.*?<\/script>/gi, '') }
}));

import { createSecurityMiddleware } from '../index';

const middleware = createSecurityMiddleware();

describe('createSecurityMiddleware processRequest', () => {
  it('sanitizes request body and generates token', async () => {
    const req = new Request('http://x', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Session-ID': 's' },
      body: JSON.stringify({ field: '<script>x</script>' })
    });

    const result = await middleware.processRequest(req);
    expect(result.sanitizedBody.field).toBe('<script>x</script>');
    expect(result.csrfToken).toBeDefined();
    expect(result.errors).toEqual([]);
  });

  it('handles invalid json gracefully', async () => {
    const req = new Request('http://x', { method: 'POST', body: 'not-json' });
    const result = await middleware.processRequest(req);
    expect(result.errors.length).toBe(1);
  });

  it('skips body processing for GET', async () => {
    const req = new Request('http://x', { method: 'GET' });
    const result = await middleware.processRequest(req);
    expect(result.sanitizedBody).toBeUndefined();
  });
});
