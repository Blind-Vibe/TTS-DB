import { describe, it, expect, beforeEach, vi } from 'vitest';
process.env.VITE_SUPABASE_URL = 'http://localhost';
process.env.VITE_SUPABASE_ANON_KEY = 'key';
vi.mock('../../../supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: { user: { id: 'user-1' } } }, error: null }))
    }
  }
}));

import { FinanceService } from '../financeService';

describe('FinanceService - generateReport', () => {
  let service: FinanceService;
  let executeQuery: any;

  beforeEach(() => {
    service = new FinanceService();
    executeQuery = vi.fn();
    (service as any).adapter.executeQuery = executeQuery;
  });

  it('generates profit and loss report using aggregates', async () => {
    executeQuery
      .mockResolvedValueOnce({ success: true, data: { sum: 5000 } })
      .mockResolvedValueOnce({ success: true, data: { sum: 2000 } })
      .mockResolvedValueOnce({
        success: true,
        data: [
          { category: 'tickets', sum: 3000, count: 2 },
          { category: 'merch', sum: 2000, count: 1 }
        ]
      });

    const result = await service.generateReport('profit_loss', '2024-01-01', '2024-01-31');

    expect(result.success).toBe(true);
    expect(result.data.data.totalIncome).toBe(5000);
    expect(result.data.data.totalExpenses).toBe(2000);
    expect(result.data.data.netIncome).toBe(3000);
    expect(result.data.data.categories.length).toBe(2);
  });
});
