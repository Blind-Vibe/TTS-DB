import { describe, it, expect } from 'vitest';
import { FileUploadSecurity } from '../index';

const security = new FileUploadSecurity();

describe('FileUploadSecurity', () => {
  it('validates safe file', () => {
    const file = { name: 'test.txt', type: 'text/plain', size: 10 } as any;
    const result = security.validateFile(file);
    expect(result.valid).toBe(true);
  });

  it('rejects large file', () => {
    const file = { name: 'a.txt', type: 'text/plain', size: 20 * 1024 * 1024 } as any;
    const result = security.validateFile(file);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('File size exceeds');
  });

  it('rejects disallowed type', () => {
    const file = { name: 'a.exe', type: 'application/x-executable', size: 1 } as any;
    const result = security.validateFile(file);
    expect(result.valid).toBe(false);
  });

  it('detects dangerous extension', () => {
    const file = { name: 'bad.exe', type: 'image/png', size: 1 } as any;
    const result = security.validateFile(file);
    expect(result.valid).toBe(false);
  });

  it('detects executable signature', () => {
    const content = new Uint8Array([0x4d, 0x5a]).buffer; // PE signature
    const file = { name: 'a.bin', type: 'application/octet-stream', size: 2, content } as any;
    const result = security.validateFile(file);
    expect(result.valid).toBe(false);
  });
});
