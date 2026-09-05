import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

export interface PeriodContextType {
  periodKey: string; // 'YYYY-MM' e.g. '2026-09'
  year: number; // e.g. 2026
  month: number; // 1-12 e.g. 9
  monthName: string; // 'September'
  periodLabel: string; // 'September 2026'
  startDate: string; // 'YYYY-MM-01'
  endDate: string; // 'YYYY-MM-DD'
  isCurrentMonth: boolean;
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
  setPeriod: (year: number, month: number) => void;
  setPeriodKey: (periodKey: string) => void;
  goToCurrentMonth: () => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const STORAGE_KEY = 'gpbc_finance_period_key';

export const calculatePeriodBounds = (year: number, month: number) => {
  const m = Math.max(1, Math.min(12, month));
  const mPad = String(m).padStart(2, '0');
  const periodKey = `${year}-${mPad}`;
  const startDate = `${periodKey}-01`;
  const lastDay = new Date(Date.UTC(year, m, 0)).getUTCDate();
  const endDate = `${periodKey}-${String(lastDay).padStart(2, '0')}`;
  const monthName = MONTH_NAMES[m - 1] || 'Unknown';
  const periodLabel = `${monthName} ${year}`;

  return {
    periodKey,
    year,
    month: m,
    monthName,
    periodLabel,
    startDate,
    endDate
  };
};

export const getCurrentPeriod = () => {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1
  };
};

const PeriodContext = createContext<PeriodContextType | undefined>(undefined);

export const PeriodProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [periodState, setPeriodState] = useState<{ year: number; month: number }>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && /^\d{4}-\d{2}$/.test(stored)) {
        const [y, m] = stored.split('-');
        const parsedYear = parseInt(y, 10);
        const parsedMonth = parseInt(m, 10);
        if (parsedYear >= 2020 && parsedMonth >= 1 && parsedMonth <= 12) {
          return { year: parsedYear, month: parsedMonth };
        }
      }
    } catch {
      // Fall through to current period
    }
    return getCurrentPeriod();
  });

  const { year, month } = periodState;

  const currentPeriod = useMemo(() => getCurrentPeriod(), []);
  const isCurrentMonth = year === currentPeriod.year && month === currentPeriod.month;

  const bounds = useMemo(() => calculatePeriodBounds(year, month), [year, month]);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, bounds.periodKey);
    } catch {
      // Ignore storage errors
    }
  }, [bounds.periodKey]);

  const setPeriod = useCallback((newYear: number, newMonth: number) => {
    const validMonth = Math.max(1, Math.min(12, newMonth));
    setPeriodState({ year: newYear, month: validMonth });
  }, []);

  const setPeriodKey = useCallback((key: string) => {
    if (typeof key === 'string' && /^\d{4}-\d{2}$/.test(key)) {
      const [y, m] = key.split('-');
      setPeriodState({ year: parseInt(y, 10), month: parseInt(m, 10) });
    }
  }, []);

  const goToPreviousMonth = useCallback(() => {
    setPeriodState(prev => {
      if (prev.month === 1) {
        return { year: prev.year - 1, month: 12 };
      }
      return { year: prev.year, month: prev.month - 1 };
    });
  }, []);

  const goToNextMonth = useCallback(() => {
    setPeriodState(prev => {
      if (prev.month === 12) {
        return { year: prev.year + 1, month: 1 };
      }
      return { year: prev.year, month: prev.month + 1 };
    });
  }, []);

  const goToCurrentMonth = useCallback(() => {
    const cur = getCurrentPeriod();
    setPeriodState(cur);
  }, []);

  const value = useMemo<PeriodContextType>(() => ({
    periodKey: bounds.periodKey,
    year: bounds.year,
    month: bounds.month,
    monthName: bounds.monthName,
    periodLabel: bounds.periodLabel,
    startDate: bounds.startDate,
    endDate: bounds.endDate,
    isCurrentMonth,
    goToPreviousMonth,
    goToNextMonth,
    setPeriod,
    setPeriodKey,
    goToCurrentMonth
  }), [bounds, isCurrentMonth, goToPreviousMonth, goToNextMonth, setPeriod, setPeriodKey, goToCurrentMonth]);

  return <PeriodContext.Provider value={value}>{children}</PeriodContext.Provider>;
};

export const usePeriod = (): PeriodContextType => {
  const context = useContext(PeriodContext);
  if (!context) {
    throw new Error('usePeriod must be used within a PeriodProvider');
  }
  return context;
};

export default PeriodContext;
