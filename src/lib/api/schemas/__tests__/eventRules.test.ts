import { describe, it, expect } from 'vitest';
import { validateEventBusinessRules, Event } from '../eventSchemas';

const baseEvent: Event = {
  id: '1',
  title: 'Test Event',
  date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  startTime: '20:00',
  endTime: '22:00',
  artistIds: [],
  ticketsSold: 0,
  totalCapacity: 100,
  ticketPrice: 25,
  status: 'upcoming',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('validateEventBusinessRules', () => {
  describe('canSellTickets', () => {
    it('allows selling tickets when enough capacity', () => {
      const result = validateEventBusinessRules.canSellTickets(baseEvent, 10);
      expect(result.valid).toBe(true);
    });

    it('prevents overselling tickets', () => {
      const result = validateEventBusinessRules.canSellTickets({
        ...baseEvent,
        ticketsSold: 95,
      }, 10);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Only 5 tickets available');
    });

    it('disallows sales for cancelled events', () => {
      const result = validateEventBusinessRules.canSellTickets({
        ...baseEvent,
        status: 'cancelled',
      }, 1);
      expect(result.valid).toBe(false);
    });
  });

  describe('canCancel', () => {
    it('disallows cancelling completed events', () => {
      const result = validateEventBusinessRules.canCancel({
        ...baseEvent,
        status: 'completed',
      });
      expect(result.valid).toBe(false);
    });

    it('disallows cancelling events that already started', () => {
      const result = validateEventBusinessRules.canCancel({
        ...baseEvent,
        date: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      });
      expect(result.valid).toBe(false);
    });
  });

  describe('canEdit', () => {
    it('prevents editing completed events', () => {
      const result = validateEventBusinessRules.canEdit({
        ...baseEvent,
        status: 'completed',
      });
      expect(result.valid).toBe(false);
    });

    it('prevents editing events that have started', () => {
      const result = validateEventBusinessRules.canEdit({
        ...baseEvent,
        date: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      });
      expect(result.valid).toBe(false);
    });

    it('allows editing upcoming events', () => {
      const result = validateEventBusinessRules.canEdit(baseEvent);
      expect(result.valid).toBe(true);
    });
  });
});
