import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SessionSecurity } from '../index';

describe('SessionSecurity', () => {
  let session: SessionSecurity;
  beforeEach(() => {
    session = new SessionSecurity();
    vi.useFakeTimers();
    vi.setSystemTime(Date.now());
  });

  it('creates and validates session', () => {
    const id = session.createSession('u', '1.1.1.1', 'agent');
    const result = session.validateSession(id, '1.1.1.1', 'agent');
    expect(result.valid).toBe(true);
    expect(result.userId).toBe('u');
  });

  it('rejects unknown session', () => {
    expect(session.validateSession('none', '', '')).toEqual({ valid: false, reason: 'Session not found' });
  });

  it('expires by age', () => {
    const id = session.createSession('u', '1', 'a');
    vi.setSystemTime(Date.now() + 25 * 60 * 60 * 1000);
    const result = session.validateSession(id, '1', 'a');
    expect(result.valid).toBe(false);
  });

  it('expires by idle timeout', () => {
    const id = session.createSession('u', '1', 'a');
    vi.setSystemTime(Date.now() + 3 * 60 * 60 * 1000);
    const result = session.validateSession(id, '1', 'a');
    expect(result.valid).toBe(false);
  });

  it('rejects ip mismatch', () => {
    const id = session.createSession('u', '1', 'a');
    const res = session.validateSession(id, '2', 'a');
    expect(res.valid).toBe(false);
  });

  it('destroys sessions', () => {
    const id = session.createSession('u', '1', 'a');
    session.destroySession(id);
    expect(session.validateSession(id, '1', 'a').valid).toBe(false);
  });

  it('cleanup removes expired sessions', () => {
    const id = session.createSession('u', '1', 'a');
    vi.setSystemTime(Date.now() + 25 * 60 * 60 * 1000);
    session.cleanup();
    expect((session as any).sessions.size).toBe(0);
  });
});
