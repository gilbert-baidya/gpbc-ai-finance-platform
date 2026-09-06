/**
 * GPBC Finance Desk — Statement Router & Linker
 *
 * Safely routes extracted statement lines into appropriate finance workflows,
 * enforces closed month boundaries, detects duplicates, and establishes reconciliation matches.
 */

import {
  ExtractedStatementLine,
  ProcessedStatementLine,
  ClassificationResult,
  PurposeResult,
  RoutingDestination
} from './types';
import { checkDuplicate, ExistingTxnRef } from './duplicateDetector';
import { detectRefundOrReversal } from './refundDetector';
import { evaluateConfidence } from './confidenceEngine';

export interface RouteStatementOptions {
  closedPeriodKeys?: string[]; // e.g. ['2026-01', '2026-02']
  existingTransactions?: ExistingTxnRef[];
  existingStagedLines?: ExistingTxnRef[];
}

export function routeStatementLine(
  extracted: ExtractedStatementLine,
  classification: ClassificationResult,
  purpose: PurposeResult,
  options: RouteStatementOptions = {}
): ProcessedStatementLine {
  const { closedPeriodKeys = [], existingTransactions = [], existingStagedLines = [] } = options;

  // 1. Evaluate Period Key (YYYY-MM)
  const periodKey = extracted.transactionDate ? extracted.transactionDate.substring(0, 7) : null;
  const isClosedPeriod = periodKey ? closedPeriodKeys.includes(periodKey) : false;

  // 2. Duplicate Detection across previously staged statement lines
  const dupCheck = extracted.transactionDate
    ? checkDuplicate(
        {
          transactionDate: extracted.transactionDate,
          amount: extracted.amount,
          direction: extracted.direction,
          merchantOrPayee: extracted.merchantOrPayee,
          referenceNumber: extracted.referenceNumber,
          sourceDocumentId: extracted.sourceDocumentId
        },
        existingStagedLines
      )
    : { isDuplicate: false, duplicateType: 'NONE' as const };

  // 3. Refund / Reversal Detection
  const refundCheck = detectRefundOrReversal(
    extracted.rawDescription,
    extracted.amount,
    extracted.direction
  );

  // 4. Transaction Matching (Search for existing un-reconciled transaction)
  let matchedTransactionId: string | undefined = undefined;
  let autoReconciled = false;

  if (!isClosedPeriod && !dupCheck.isDuplicate && extracted.transactionDate && extracted.direction !== 'UNKNOWN') {
    const txnDate = new Date(extracted.transactionDate).getTime();
    const cleanMerchant = (extracted.merchantOrPayee || '').toLowerCase();

    const match = existingTransactions.find(t => {
      if (t.direction !== extracted.direction) return false;
      if (Math.abs(t.amount - extracted.amount) > 0.001) return false;
      const tDate = new Date(t.date).getTime();
      const diffDays = Math.abs(txnDate - tDate) / (1000 * 60 * 60 * 24);
      if (diffDays > 3) return false;

      // Check merchant or reference match
      if (extracted.referenceNumber && t.referenceNumber && extracted.referenceNumber === t.referenceNumber) {
        return true;
      }
      const tMerchant = (t.payeeOrPayer || '').toLowerCase();
      if (cleanMerchant && tMerchant && (cleanMerchant.includes(tMerchant) || tMerchant.includes(cleanMerchant))) {
        return true;
      }
      return diffDays <= 1;
    });

    if (match && match.transactionId) {
      matchedTransactionId = match.transactionId;
      autoReconciled = true;
    }
  }

  // 5. Determine Routing Destination
  let routingDestination: RoutingDestination = 'RECONCILIATION_STAGING';
  let routingReason = 'Staged in Reconciliation_Staging for month-end reconciliation';

  if (isClosedPeriod) {
    routingDestination = 'POST_CLOSE_REVIEW';
    routingReason = 'Transaction belongs to a closed accounting period.';
  } else if (dupCheck.isDuplicate && dupCheck.duplicateType === 'EXACT') {
    routingDestination = 'DUPLICATE_REVIEW';
    routingReason = dupCheck.duplicateReason || 'Exact duplicate detected';
  } else if (refundCheck.isRefundOrReversal) {
    routingDestination = 'REFUND_REVIEW';
    routingReason = `Detected ${refundCheck.refundType?.toLowerCase()} adjustment`;
  } else if (matchedTransactionId) {
    routingDestination = 'AUTO_MATCHED_TRANSACTION';
    routingReason = `Matched with existing Transaction ${matchedTransactionId}`;
  }

  // 6. Compute Confidence
  const confidence = evaluateConfidence({
    merchantConfidence: extracted.merchantOrPayee !== 'Unknown Merchant' ? 'HIGH' : 'LOW',
    amountConfidence: extracted.amount > 0 ? 'HIGH' : 'LOW',
    dateConfidence: extracted.transactionDate ? 'HIGH' : 'LOW',
    categoryConfidence: classification.confidence,
    purposeConfidence: purpose.purposeConfidence
  });

  return {
    ...extracted,
    category: classification.category,
    classificationSource: classification.classificationSource,
    classificationStatus: (!extracted.transactionDate || extracted.direction === 'UNKNOWN' || confidence.overallConfidence === 'LOW')
      ? 'NEEDS_REVIEW'
      : classification.classificationStatus,
    businessPurpose: purpose.purpose,
    purposeConfidence: purpose.purposeConfidence,
    confidence,
    routingDestination,
    routingReason,
    matchedTransactionId,
    autoReconciled,
    isRefund: refundCheck.isRefundOrReversal,
    isDuplicate: dupCheck.isDuplicate,
    duplicateType: dupCheck.duplicateType,
    isClosedPeriod,
    postCloseReason: isClosedPeriod ? 'Automatically imported statement evidence after period close' : undefined,
    auditMetadata: {
      processedAt: new Date().toISOString(),
      modelOrEngine: 'GPBC_Deterministic_Extraction_Engine_v1',
      ruleIdApplied: classification.classificationRuleId,
      rawText: extracted.rawDescription
    }
  };
}
