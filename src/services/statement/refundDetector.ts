/**
 * GPBC Finance Desk — Refund & Reversal Detector
 *
 * Detects refunds, reversals, credits, and chargebacks.
 * Prevents treating refunds as ordinary church income.
 */

import { RefundCheckResult, Direction } from './types';

const REFUND_KEYWORDS = [
  'refund',
  'reversal',
  'chargeback',
  'return item',
  'adjustment credit',
  'merch return',
  'credit adj',
  'returned payment',
  'dispute credit'
];

export function detectRefundOrReversal(
  rawDescription: string,
  _amount: number,
  direction: Direction
): RefundCheckResult {
  const text = (rawDescription || '').toLowerCase();

  for (const kw of REFUND_KEYWORDS) {
    if (text.includes(kw)) {
      let refundType: 'REFUND' | 'CREDIT' | 'REVERSAL' | 'CHARGEBACK' = 'REFUND';
      if (text.includes('reversal')) refundType = 'REVERSAL';
      else if (text.includes('chargeback') || text.includes('dispute')) refundType = 'CHARGEBACK';
      else if (text.includes('credit')) refundType = 'CREDIT';

      return {
        isRefundOrReversal: true,
        refundType,
        suggestedOriginalDirection: direction === 'INCOME' ? 'EXPENSE' : 'INCOME'
      };
    }
  }

  return {
    isRefundOrReversal: false,
    refundType: 'NONE',
    suggestedOriginalDirection: direction
  };
}
