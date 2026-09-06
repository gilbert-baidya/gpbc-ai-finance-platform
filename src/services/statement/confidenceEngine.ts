/**
 * GPBC Finance Desk — Confidence Engine
 *
 * Computes multi-factor confidence ratings for extracted statement lines.
 */

import { ConfidenceBreakdown, ConfidenceLevel } from './types';

export function evaluateConfidence(params: {
  merchantConfidence: ConfidenceLevel;
  amountConfidence: ConfidenceLevel;
  dateConfidence: ConfidenceLevel;
  categoryConfidence: ConfidenceLevel;
  purposeConfidence: ConfidenceLevel;
}): ConfidenceBreakdown {
  const {
    merchantConfidence,
    amountConfidence,
    dateConfidence,
    categoryConfidence,
    purposeConfidence
  } = params;

  let overallConfidence: ConfidenceLevel = 'HIGH';

  if (
    merchantConfidence === 'LOW' ||
    amountConfidence === 'LOW' ||
    dateConfidence === 'LOW' ||
    categoryConfidence === 'LOW'
  ) {
    overallConfidence = 'LOW';
  } else if (
    merchantConfidence === 'MEDIUM' ||
    categoryConfidence === 'MEDIUM' ||
    purposeConfidence === 'MEDIUM'
  ) {
    overallConfidence = 'MEDIUM';
  }

  return {
    merchantConfidence,
    amountConfidence,
    dateConfidence,
    categoryConfidence,
    purposeConfidence,
    overallConfidence
  };
}
