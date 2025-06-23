import { describe, it, expect } from 'vitest';
import { defaultFileUploadSecurity } from '../index';

describe('FileUploadSecurity content scanning', () => {
  it('reports executable content errors', () => {
    const content = new Uint8Array([0x4d, 0x5a, 0x90, 0x00]).buffer;
    const file = {
      name: 'safe.jpg',
      type: 'image/jpeg',
      size: content.byteLength,
      content,
    };

    const result = defaultFileUploadSecurity.validateFile(file);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('File contains executable code');
  });
});
