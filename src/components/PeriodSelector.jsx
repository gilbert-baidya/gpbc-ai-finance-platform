import React from 'react';
import { ChevronLeft, ChevronRight, Calendar, RotateCcw } from 'lucide-react';
import { usePeriod } from '../context/PeriodContext';
import './PeriodSelector.css';

const MONTH_OPTIONS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' }
];

const YEAR_OPTIONS = [2024, 2025, 2026, 2027, 2028, 2029, 2030];

export const PeriodSelector = ({ className = '', compact = false }) => {
  const {
    year,
    month,
    isCurrentMonth,
    goToPreviousMonth,
    goToNextMonth,
    setPeriod,
    goToCurrentMonth
  } = usePeriod();

  const handleMonthChange = (e) => {
    const newMonth = parseInt(e.target.value, 10);
    setPeriod(year, newMonth);
  };

  const handleYearChange = (e) => {
    const newYear = parseInt(e.target.value, 10);
    setPeriod(newYear, month);
  };

  return (
    <div className={`period-selector-container ${compact ? 'compact' : ''} ${className}`} aria-label="Global Finance Period Selector">
      <div className="period-selector-bar">
        <button
          type="button"
          className="period-nav-btn"
          onClick={goToPreviousMonth}
          title="Previous Month"
          aria-label="Previous Month"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="period-controls-group">
          <Calendar size={14} className="period-icon" aria-hidden="true" />

          <select
            className="period-select month-select"
            value={month}
            onChange={handleMonthChange}
            aria-label="Select Finance Month"
          >
            {MONTH_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            className="period-select year-select"
            value={year}
            onChange={handleYearChange}
            aria-label="Select Finance Year"
          >
            {YEAR_OPTIONS.map(y => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          className="period-nav-btn"
          onClick={goToNextMonth}
          title="Next Month"
          aria-label="Next Month"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {!isCurrentMonth ? (
        <button
          type="button"
          className="current-period-shortcut"
          onClick={goToCurrentMonth}
          title="Jump to Current Month"
          aria-label="Jump to Current Month"
        >
          <RotateCcw size={12} />
          <span>Current</span>
        </button>
      ) : (
        <span className="current-period-badge" title="Viewing current calendar period">
          Current
        </span>
      )}
    </div>
  );
};

export default PeriodSelector;
