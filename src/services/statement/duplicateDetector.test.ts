import { describe, it, expect } from 'vitest';
import { checkDuplicate } from './duplicateDetector';

describe('Duplicate Detector', () => {
  it('detects exact reference number duplicates', () => {
    const existing = [
      {
        transactionId: 'TXN-001',
        date: '2026-03-01',
        amount: 2567.50,
        direction: 'EXPENSE' as const,
        referenceNumber: '104000019610307'
      }
    ];

    const result = checkDuplicate(
      {
        transactionDate: '2026-03-01',
        amount: 2567.50,
        direction: 'EXPENSE',
        merchantOrPayee: 'Churchwest',
        referenceNumber: '104000019610307'
      },
      existing
    );

    expect(result.isDuplicate).toBe(true);
    expect(result.duplicateType).toBe('EXACT');
    expect(result.matchedEntityId).toBe('TXN-001');
  });

  it('detects exact date, amount, and merchant duplicates', () => {
    const existing = [
      {
        transactionId: 'TXN-002',
        date: '2026-03-02',
        amount: 31.21,
        direction: 'EXPENSE' as const,
        payeeOrPayer: 'San Bernardino Alarm'
      }
    ];

    const result = checkDuplicate(
      {
        transactionDate: '2026-03-02',
        amount: 31.21,
        direction: 'EXPENSE',
        merchantOrPayee: 'San Bernardino Alarm'
      },
      existing
    );

    expect(result.isDuplicate).toBe(true);
    expect(result.duplicateType).toBe('EXACT');
  });

  it('detects probable duplicates within date threshold', () => {
    const existing = [
      {
        transactionId: 'TXN-003',
        date: '2026-03-02',
        amount: 80.00,
        direction: 'EXPENSE' as const,
        payeeOrPayer: 'Other Payee'
      }
    ];

    const result = checkDuplicate(
      {
        transactionDate: '2026-03-03',
        amount: 80.00,
        direction: 'EXPENSE',
        merchantOrPayee: 'James Trupest'
      },
      existing
    );

    expect(result.isDuplicate).toBe(true);
    expect(result.duplicateType).toBe('PROBABLE');
  });
});
