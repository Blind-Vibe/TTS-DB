import { describe, it, expect } from 'vitest';
import { keyGenerators } from '../rateLimit';
import { Buffer } from 'node:buffer';

const createRequest = (token?: string) => {
  const headers: Record<string, string> = {
    'x-forwarded-for': '203.0.113.5'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return new Request('https://example.com', { headers });
};

describe('keyGenerators.user', () => {
  it('uses user id from valid token', async () => {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({ sub: 'user-42' })).toString('base64url');
    const token = `${header}.${payload}.sig`;
    const request = createRequest(token);
    const key = await keyGenerators.user(request);
    expect(key).toBe('user:user-42');
  });

  it('falls back to ip for invalid token', async () => {
    const request = createRequest('invalid.token');
    const key = await keyGenerators.user(request);
    expect(key).toBe('203.0.113.5');
  });
});
