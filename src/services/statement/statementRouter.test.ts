import { describe, it, expect } from 'vitest';
import { routeStatementLine } from './statementRouter';
import { ExtractedStatementLine, ClassificationResult, PurposeResult } from './types';

describe('Statement Router', () => {
  const baseLine: ExtractedStatementLine = {
    tempId: 'STMT-1',
    transactionDate: '2026-03-03',
    amount: 31.21,
    direction: 'EXPENSE',
    rawDescription: 'SAN BERNARDINO ALARM',
    cleanDescription: 'SAN BERNARDINO ALARM',
    merchantOrPayee: 'San Bernardino Alarm',
    paymentChannel: 'ACH'
  };

  const baseClassification: ClassificationResult = {
    category: 'Facility & Security',
    classificationSource: 'VENDOR_LEARNING',
    classificationStatus: 'AUTOMATIC',
    confidence: 'HIGH'
  };

  const basePurpose: PurposeResult = {
    purpose: 'Security / Alarm Monitoring',
    purposeConfidence: 'HIGH',
    isInferred: true
  };

  it('routes standard unclosed lines to RECONCILIATION_STAGING', () => {
    const routed = routeStatementLine(baseLine, baseClassification, basePurpose, {
      closedPeriodKeys: ['2026-01', '2026-02']
    });

    expect(routed.routingDestination).toBe('RECONCILIATION_STAGING');
    expect(routed.isClosedPeriod).toBe(false);
  });

  it('routes closed month transactions to POST_CLOSE_REVIEW with audit reason', () => {
    const closedLine: ExtractedStatementLine = {
      ...baseLine,
      transactionDate: '2026-02-15'
    };

    const routed = routeStatementLine(closedLine, baseClassification, basePurpose, {
      closedPeriodKeys: ['2026-01', '2026-02']
    });

    expect(routed.routingDestination).toBe('POST_CLOSE_REVIEW');
    expect(routed.isClosedPeriod).toBe(true);
    expect(routed.postCloseReason).toBe('Automatically imported statement evidence after period close');
  });

  it('auto-matches with existing transaction when available', () => {
    const existing = [
      {
        transactionId: 'TXN-999',
        date: '2026-03-03',
        amount: 31.21,
        direction: 'EXPENSE' as const,
        payeeOrPayer: 'San Bernardino Alarm'
      }
    ];

    const routed = routeStatementLine(baseLine, baseClassification, basePurpose, {
      existingTransactions: existing
    });

    expect(routed.routingDestination).toBe('AUTO_MATCHED_TRANSACTION');
    expect(routed.matchedTransactionId).toBe('TXN-999');
    expect(routed.autoReconciled).toBe(true);
  });
});
