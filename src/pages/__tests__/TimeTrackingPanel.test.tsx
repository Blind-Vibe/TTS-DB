import React from 'react';
import { describe, it, expect } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '../../test/test-utils';
import { TimeTrackingPanel } from '../StaffManagement';
import { StaffMember, TimeEntry } from '../../types';

const staff: StaffMember[] = [
  {
    id: '1',
    firstName: 'Alice',
    lastName: 'Smith',
    email: 'alice@example.com',
    position: 'Worker',
    department: 'Ops',
    hourlyRate: 20,
    isActive: true,
    hireDate: '2020-01-01',
    skills: [],
  },
];

const Wrapper: React.FC = () => {
  const [entries, setEntries] = React.useState<TimeEntry[]>([]);
  return (
    <TimeTrackingPanel staff={staff} entries={entries} onLog={(e) => setEntries(prev => [...prev, e])} />
  );
};

describe('TimeTrackingPanel', () => {
  it('allows logging hours and displays calculated pay', async () => {
    render(<Wrapper />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/hours worked/i), '3');
    await user.click(screen.getByRole('button', { name: /log hours/i }));

    expect(await screen.findByText('$60.00')).toBeInTheDocument();
    expect(screen.getByText(/alice smith/i)).toBeInTheDocument();
  });
});
