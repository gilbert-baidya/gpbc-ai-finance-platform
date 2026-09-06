import { describe, it, expect } from 'vitest';
import { detectRefundOrReversal } from './refundDetector';

describe('Refund Detector', () => {
  it('detects refunds and credit adjustments correctly', () => {
    const res1 = detectRefundOrReversal('AMAZON.COM REFUND', 24.50, 'INCOME');
    expect(res1.isRefundOrReversal).toBe(true);
    expect(res1.refundType).toBe('REFUND');
    expect(res1.suggestedOriginalDirection).toBe('EXPENSE');

    const res2 = detectRefundOrReversal('DISPUTE REVERSAL CREDIT', 150.00, 'INCOME');
    expect(res2.isRefundOrReversal).toBe(true);
    expect(res2.refundType).toBe('REVERSAL');
  });

  it('ignores standard revenue and tithes', () => {
    const res = detectRefundOrReversal('SUNDAY TITHE OFFERING', 1200.00, 'INCOME');
    expect(res.isRefundOrReversal).toBe(false);
  });
});
