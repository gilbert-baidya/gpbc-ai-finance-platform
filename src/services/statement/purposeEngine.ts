/**
 * GPBC Finance Desk — Purpose Engine
 *
 * Infers a concise, context-aware business purpose for extracted statement lines.
 */

import { PurposeResult, Direction } from './types';
import { vendorLearningStore } from './vendorLearningStore';

export function inferPurpose(
  merchantOrPayee: string,
  category: string,
  rawDescription: string,
  paymentChannel: string,
  direction: Direction
): PurposeResult {
  // 1. Check Vendor Learning Store for preset purpose
  const learned = vendorLearningStore.findMatch(merchantOrPayee, rawDescription);
  if (learned && learned.defaultPurpose) {
    return {
      purpose: learned.defaultPurpose,
      purposeConfidence: learned.confidence || 'HIGH',
      isInferred: false
    };
  }

  const text = `${merchantOrPayee} ${rawDescription}`.toLowerCase();

  // 2. Specific domain inferences
  if (text.includes('alarm') || text.includes('security')) {
    return {
      purpose: 'Security / Alarm Monitoring',
      purposeConfidence: 'HIGH',
      isInferred: true
    };
  }

  if (category === 'Utilities' || text.includes('electric') || text.includes('gas') || text.includes('water')) {
    return {
      purpose: 'Monthly Sanctuary Utility Service',
      purposeConfidence: 'HIGH',
      isInferred: true
    };
  }

  if (category === 'Insurance' || text.includes('insurance')) {
    return {
      purpose: 'Insurance / Administrative Expense',
      purposeConfidence: 'HIGH',
      isInferred: true
    };
  }

  if (category === 'Honorariums' || text.includes('pastor') || text.includes('speaker')) {
    return {
      purpose: `Honorarium for ${merchantOrPayee || 'Guest Speaker'}`,
      purposeConfidence: 'HIGH',
      isInferred: true
    };
  }

  if (category === 'Ministry Supplies' || text.includes('office depot') || text.includes('supplies')) {
    return {
      purpose: 'Ministry Supplies & Materials',
      purposeConfidence: 'HIGH',
      isInferred: true
    };
  }

  if (direction === 'INCOME') {
    if (category === 'Tithes & Offerings' || text.includes('tithe') || text.includes('offering')) {
      return {
        purpose: 'Sunday Tithes & General Offerings',
        purposeConfidence: 'HIGH',
        isInferred: true
      };
    }
    if (category === 'Building Fund') {
      return {
        purpose: 'Designated Sanctuary Building Contribution',
        purposeConfidence: 'HIGH',
        isInferred: true
      };
    }
    return {
      purpose: `Church Income from ${merchantOrPayee || 'Donor'}`,
      purposeConfidence: 'MEDIUM',
      isInferred: true
    };
  }

  // 3. Payment channel contextual fallback
  if (paymentChannel === 'ZELLE') {
    return {
      purpose: `Zelle Payment to ${merchantOrPayee || 'Recipient'}`,
      purposeConfidence: 'MEDIUM',
      isInferred: true
    };
  }

  if (paymentChannel === 'CHECK') {
    return {
      purpose: `Check Payment to ${merchantOrPayee || 'Payee'}`,
      purposeConfidence: 'MEDIUM',
      isInferred: true
    };
  }

  if (category && category !== 'Needs Classification') {
    return {
      purpose: `${category} Expense for ${merchantOrPayee}`,
      purposeConfidence: 'MEDIUM',
      isInferred: true
    };
  }

  // 4. Safe conservative fallback
  const firstLine = rawDescription.split('\n')[0].trim().substring(0, 40);
  return {
    purpose: firstLine || `Disbursement to ${merchantOrPayee || 'Payee'}`,
    purposeConfidence: 'LOW',
    isInferred: true
  };
}
