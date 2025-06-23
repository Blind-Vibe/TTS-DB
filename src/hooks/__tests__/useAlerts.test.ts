import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/openaiClient', () => ({
  openai: {
    chat: { completions: { create: vi.fn() } }
  }
}));

import { generateRealTimeAlert } from '../useAlerts';
import { openai } from '../../lib/openaiClient';

const alertData = {
  metric_name: 'Revenue',
  current_value: 1200,
  threshold: 1000,
  comparison: 'above' as const
};

describe('generateRealTimeAlert', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns fallback alert when API key is missing', async () => {
    // simulate missing key
    (import.meta as any).env = { ...import.meta.env, VITE_OPENAI_API_KEY: '' };
    const alert = await generateRealTimeAlert(alertData);
    expect(alert).toContain('Revenue is above');
  });

  it('calls OpenAI when API key is present', async () => {
    (import.meta as any).env = { ...import.meta.env, VITE_OPENAI_API_KEY: 'test' };
    process.env.VITE_OPENAI_API_KEY = 'test';
    (openai.chat.completions.create as any).mockResolvedValue({ choices: [{ message: { content: 'AI Alert' } }] });
    const alert = await generateRealTimeAlert(alertData);
    expect(openai.chat.completions.create).toHaveBeenCalled();
    expect(alert).toBe('AI Alert');
  });
});

