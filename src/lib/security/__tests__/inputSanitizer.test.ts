import { describe, it, expect, vi } from 'vitest';

vi.mock('dompurify', () => ({
  default: {
    sanitize: (input: string) => input.replace(/<script[^>]*>.*?<\/script>/gi, '')
  }
}));

import { InputSanitizer } from '../index';

describe('InputSanitizer', () => {
  const sanitizer = new InputSanitizer();

  it('sanitizes text when XSS protection enabled', () => {
    const result = sanitizer.sanitizeText('<script>alert("x")</script>safe');
    expect(result).toBe('safe');
  });

  it('returns input unchanged when XSS protection disabled', () => {
    const disabled = new InputSanitizer({
      ...sanitizer['config'],
      enableXSSProtection: false
    });
    const text = '<script>alert("x")</script>safe';
    expect(disabled.sanitizeText(text)).toBe(text);
  });

  it('sanitizes HTML with allowed tags', () => {
    const html = '<p>test</p><script>alert(1)</script>';
    const result = sanitizer.sanitizeHTML(html);
    expect(result).toBe('<p>test</p>');
  });

  it('validates and sanitizes email', () => {
    const email = 'TEST@EXAMPLE.COM ';
    expect(sanitizer.sanitizeEmail(email)).toBe('test@example.com');
  });

  it('throws on invalid email', () => {
    expect(() => sanitizer.sanitizeEmail('bad')).toThrow();
  });

  it('sanitizes url and enforces protocol', () => {
    const url = 'https://example.com';
    expect(sanitizer.sanitizeURL(url)).toBe(url + '/');
    expect(() => sanitizer.sanitizeURL('ftp://bad')).toThrow();
  });

  it('sanitizes filenames', () => {
    const name = '../../evil.exe';
    expect(sanitizer.sanitizeFilename(name)).toBe('_._evil.exe');
  });

  it('removes sql injection patterns', () => {
    const result = sanitizer.sanitizeSQLParameter("SELECT * FROM users WHERE id='1' --");
    expect(result).not.toMatch(/SELECT|--/);
  });
});
