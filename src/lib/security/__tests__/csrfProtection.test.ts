import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CSRFProtection } from '../index';

const now = Date.now();
vi.useFakeTimers();

describe('CSRFProtection', () => {
  let csrf: CSRFProtection;
  beforeEach(() => {
    csrf = new CSRFProtection();
    vi.setSystemTime(now);
  });

  it('generates and validates tokens', () => {
    const token = csrf.generateToken('session');
    expect(csrf.validateToken('session', token)).toBe(true);
    expect(csrf.validateToken('session', token)).toBe(false); // reuse
  });

  it('rejects invalid tokens', () => {
    csrf.generateToken('a');
    expect(csrf.validateToken('a', 'bad')).toBe(false);
  });

  it('expires tokens over time', () => {
    const token = csrf.generateToken('s');
    vi.setSystemTime(now + 61 * 60 * 1000);
    expect(csrf.validateToken('s', token)).toBe(false);
  });

  it('cleanup removes stale tokens', () => {
    const token = csrf.generateToken('s');
    csrf.validateToken('s', token); // mark used
    csrf.cleanup();
    expect((csrf as any).tokens.size).toBe(0);
  });
});
