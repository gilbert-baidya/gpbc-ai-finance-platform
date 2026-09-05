import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { PeriodProvider, usePeriod, calculatePeriodBounds } from './PeriodContext';

const TestComponent = () => {
  const {
    periodKey,
    year,
    month,
    monthName,
    periodLabel,
    startDate,
    endDate,
    goToPreviousMonth,
    goToNextMonth,
    setPeriod,
    goToCurrentMonth
  } = usePeriod();

  return (
    <div>
      <span data-testid="period-key">{periodKey}</span>
      <span data-testid="year">{year}</span>
      <span data-testid="month">{month}</span>
      <span data-testid="month-name">{monthName}</span>
      <span data-testid="period-label">{periodLabel}</span>
      <span data-testid="start-date">{startDate}</span>
      <span data-testid="end-date">{endDate}</span>
      <button data-testid="prev-btn" onClick={goToPreviousMonth}>Prev</button>
      <button data-testid="next-btn" onClick={goToNextMonth}>Next</button>
      <button data-testid="set-period-btn" onClick={() => setPeriod(2026, 9)}>Set Sep 2026</button>
      <button data-testid="current-btn" onClick={goToCurrentMonth}>Current</button>
    </div>
  );
};

describe('PeriodContext & Bounds Engine', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('calculatePeriodBounds computes accurate month bounds and labels', () => {
    const sep2026 = calculatePeriodBounds(2026, 9);
    expect(sep2026.periodKey).toBe('2026-09');
    expect(sep2026.monthName).toBe('September');
    expect(sep2026.periodLabel).toBe('September 2026');
    expect(sep2026.startDate).toBe('2026-09-01');
    expect(sep2026.endDate).toBe('2026-09-30');

    const feb2028 = calculatePeriodBounds(2028, 2); // Leap year
    expect(feb2028.periodKey).toBe('2028-02');
    expect(feb2028.endDate).toBe('2028-02-29');

    const feb2027 = calculatePeriodBounds(2027, 2); // Non-leap year
    expect(feb2027.endDate).toBe('2027-02-28');
  });

  it('navigates previous and next months correctly across year boundaries', () => {
    render(
      <PeriodProvider>
        <TestComponent />
      </PeriodProvider>
    );

    // Set to September 2026
    act(() => {
      screen.getByTestId('set-period-btn').click();
    });
    expect(screen.getByTestId('period-key').textContent).toBe('2026-09');
    expect(screen.getByTestId('period-label').textContent).toBe('September 2026');

    // Go next -> October 2026
    act(() => {
      screen.getByTestId('next-btn').click();
    });
    expect(screen.getByTestId('period-key').textContent).toBe('2026-10');

    // Go prev twice -> August 2026
    act(() => {
      screen.getByTestId('prev-btn').click();
      screen.getByTestId('prev-btn').click();
    });
    expect(screen.getByTestId('period-key').textContent).toBe('2026-08');
  });

  it('persists selected period in localStorage', () => {
    render(
      <PeriodProvider>
        <TestComponent />
      </PeriodProvider>
    );

    act(() => {
      screen.getByTestId('set-period-btn').click();
    });

    expect(localStorage.getItem('gpbc_finance_period_key')).toBe('2026-09');
  });
});
