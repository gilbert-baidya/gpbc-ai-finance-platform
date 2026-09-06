import { describe, it, expect } from 'vitest';
import { inferPurpose } from './purposeEngine';

describe('Purpose Engine', () => {
  it('infers purpose from known vendor mappings', () => {
    const res1 = inferPurpose('San Bernardino Alarm', 'Facility & Security', 'ALARM MONITORING', 'ACH', 'EXPENSE');
    expect(res1.purpose).toBe('Security / Alarm Monitoring');
    expect(res1.purposeConfidence).toBe('HIGH');

    const res2 = inferPurpose('Churchwest', 'Insurance', 'ACH DEBIT CHURCHWEST', 'ACH', 'EXPENSE');
    expect(res2.purpose).toBe('Insurance / Administrative Expense');
    expect(res2.purposeConfidence).toBe('HIGH');
  });

  it('infers purpose for Zelle recipient contextually', () => {
    const res = inferPurpose('James Trupest', 'Needs Classification', 'ZELLE PAYMENT TO JAMES TRUPEST', 'ZELLE', 'EXPENSE');
    expect(res.purpose).toBe('Zelle Payment to James Trupest');
    expect(res.purposeConfidence).toBe('MEDIUM');
  });

  it('infers purpose for tithes and offerings', () => {
    const res = inferPurpose('Congregation', 'Tithes & Offerings', 'SUNDAY OFFERING', 'CHECK', 'INCOME');
    expect(res.purpose).toBe('Sunday Tithes & General Offerings');
    expect(res.purposeConfidence).toBe('HIGH');
  });
});
