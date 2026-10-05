/**
 * Unit tests for ViewTabs.jsx
 *
 * Covers:
 *   - renders all three tab labels
 *   - active tab has aria-selected=true; others are false
 *   - clicking a tab calls onTabChange with the correct id
 *   - active CSS class applied to selected tab only
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ViewTabs from '../../src/components/dashboard/ViewTabs';

describe('ViewTabs', () => {
  it('renders all three tab buttons', () => {
    render(<ViewTabs activeTab="day" onTabChange={() => {}} />);
    expect(screen.getByRole('tab', { name: 'Current Day' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Last 7 Days' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Last Quarter' })).toBeInTheDocument();
  });

  it('renders a tablist nav element', () => {
    render(<ViewTabs activeTab="day" onTabChange={() => {}} />);
    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });

  it('marks the active tab as aria-selected=true', () => {
    render(<ViewTabs activeTab="week" onTabChange={() => {}} />);
    expect(screen.getByRole('tab', { name: 'Last 7 Days' })).toHaveAttribute('aria-selected', 'true');
  });

  it('marks non-active tabs as aria-selected=false', () => {
    render(<ViewTabs activeTab="week" onTabChange={() => {}} />);
    expect(screen.getByRole('tab', { name: 'Current Day' })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('tab', { name: 'Last Quarter' })).toHaveAttribute('aria-selected', 'false');
  });

  it('calls onTabChange with "day" when Current Day is clicked', () => {
    const handler = jest.fn();
    render(<ViewTabs activeTab="week" onTabChange={handler} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Current Day' }));
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith('day');
  });

  it('calls onTabChange with "week" when Last 7 Days is clicked', () => {
    const handler = jest.fn();
    render(<ViewTabs activeTab="day" onTabChange={handler} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Last 7 Days' }));
    expect(handler).toHaveBeenCalledWith('week');
  });

  it('calls onTabChange with "quarter" when Last Quarter is clicked', () => {
    const handler = jest.fn();
    render(<ViewTabs activeTab="day" onTabChange={handler} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Last Quarter' }));
    expect(handler).toHaveBeenCalledWith('quarter');
  });

  it('applies active CSS class to the selected tab only', () => {
    render(<ViewTabs activeTab="quarter" onTabChange={() => {}} />);
    const quarterTab = screen.getByRole('tab', { name: 'Last Quarter' });
    const dayTab     = screen.getByRole('tab', { name: 'Current Day' });
    expect(quarterTab.className).toContain('view-tabs__tab--active');
    expect(dayTab.className).not.toContain('view-tabs__tab--active');
  });
});
