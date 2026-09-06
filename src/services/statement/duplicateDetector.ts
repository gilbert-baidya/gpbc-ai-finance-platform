/**
 * GPBC Finance Desk — Duplicate Detector
 *
 * Protects against duplicate entry creation by checking extracted statement lines
 * against existing transactions and existing staged statement lines.
 */

import { DuplicateCheckResult, Direction } from './types';

export interface ExistingTxnRef {
  transactionId?: string;
  date: string;
  amount: number;
  direction: Direction;
  payeeOrPayer?: string;
  referenceNumber?: string;
  sourceDocumentId?: string;
}

export function checkDuplicate(
  candidate: {
    transactionDate: string;
    amount: number;
    direction: Direction;
    merchantOrPayee: string;
    referenceNumber?: string;
    sourceDocumentId?: string;
  },
  existingRecords: ExistingTxnRef[] = []
): DuplicateCheckResult {
  if (!existingRecords || existingRecords.length === 0) {
    return { isDuplicate: false, duplicateType: 'NONE' };
  }

  const candDate = candidate.transactionDate ? new Date(candidate.transactionDate).getTime() : 0;
  const candMerchant = (candidate.merchantOrPayee || '').toLowerCase().trim();
  const candRef = (candidate.referenceNumber || '').trim();

  for (const existing of existingRecords) {
    // Direction must match
    if (existing.direction !== candidate.direction) continue;

    // Amount must match exactly (within $0.001)
    if (Math.abs(existing.amount - candidate.amount) > 0.001) continue;

    const existDate = existing.date ? new Date(existing.date).getTime() : 0;
    const dateDiffDays = Math.abs(candDate - existDate) / (1000 * 60 * 60 * 24);

    // 1. Exact match on reference/trace number
    if (candRef && existing.referenceNumber && candRef === existing.referenceNumber) {
      return {
        isDuplicate: true,
        duplicateType: 'EXACT',
        duplicateReason: `Exact reference/trace number match: ${candRef}`,
        matchedEntityId: existing.transactionId
      };
    }

    // 2. Exact match on date, amount, merchant
    const existMerchant = (existing.payeeOrPayer || '').toLowerCase().trim();
    if (dateDiffDays === 0 && (candMerchant === existMerchant || (candMerchant && existMerchant && (candMerchant.includes(existMerchant) || existMerchant.includes(candMerchant))))) {
      return {
        isDuplicate: true,
        duplicateType: 'EXACT',
        duplicateReason: `Exact date (${candidate.transactionDate}), amount ($${candidate.amount}), and merchant match`,
        matchedEntityId: existing.transactionId
      };
    }

    // 3. Probable match (same amount within 2 days)
    if (dateDiffDays <= 2) {
      return {
        isDuplicate: true,
        duplicateType: 'PROBABLE',
        duplicateReason: `Similar amount ($${candidate.amount}) found on ${existing.date} for ${existing.payeeOrPayer || 'merchant'}`,
        matchedEntityId: existing.transactionId
      };
    }
  }

  return { isDuplicate: false, duplicateType: 'NONE' };
}
