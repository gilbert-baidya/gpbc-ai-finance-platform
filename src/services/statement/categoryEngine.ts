/**
 * GPBC Finance Desk — 5-Tier Category Engine
 *
 * Classifies extracted bank statement lines through a strict 5-tier hierarchy:
 * 1. Vendor Learning Store
 * 2. GPBC Historical Transaction Match
 * 3. Deterministic Keyword & Rule Match
 * 4. AI Provider
 * 5. Safe Fallback ("Needs Classification" + NEEDS_REVIEW)
 */

import { ClassificationResult, Direction } from './types';
import { vendorLearningStore } from './vendorLearningStore';

interface HistoricalTxn {
  payeeOrPayer: string;
  category: string;
}

const DETERMINISTIC_KEYWORD_RULES: Array<{
  ruleId: string;
  pattern: RegExp;
  category: string;
  directionConstraint?: 'INCOME' | 'EXPENSE';
}> = [
  // Income rules
  { ruleId: 'RULE_TITHE_OFFERING', pattern: /\b(tithe|offering|sunday offering|donation|pledge)\b/i, category: 'Tithes & Offerings', directionConstraint: 'INCOME' },
  { ruleId: 'RULE_BUILDING_FUND', pattern: /\b(building fund|sanctuary fund|capital campaign)\b/i, category: 'Building Fund', directionConstraint: 'INCOME' },
  { ruleId: 'RULE_MISSIONS_INCOME', pattern: /\b(mission fund|missionary offering)\b/i, category: 'Missions', directionConstraint: 'INCOME' },

  // Expense rules
  { ruleId: 'RULE_UTILITIES', pattern: /\b(electric|power|gas|pge|edison|water|utility|utilities|trash|waste|sewer)\b/i, category: 'Utilities', directionConstraint: 'EXPENSE' },
  { ruleId: 'RULE_SECURITY', pattern: /\b(alarm|security|surveillance|fire alarm|monitoring)\b/i, category: 'Facility & Security', directionConstraint: 'EXPENSE' },
  { ruleId: 'RULE_INSURANCE', pattern: /\b(insurance|guideone|policy|coverage)\b/i, category: 'Insurance', directionConstraint: 'EXPENSE' },
  { ruleId: 'RULE_HONORARIUM', pattern: /\b(honorarium|pastor|speaker|guest preacher|evangelist)\b/i, category: 'Honorariums', directionConstraint: 'EXPENSE' },
  { ruleId: 'RULE_MINISTRY_SUPPLIES', pattern: /\b(craft|sunday school|vbs|curriculum|office depot|staples|supplies)\b/i, category: 'Ministry Supplies', directionConstraint: 'EXPENSE' },
  { ruleId: 'RULE_SOFTWARE_TECH', pattern: /\b(zoom|google|gsuite|microsoft|adobe|software|domain|hostinger|aws)\b/i, category: 'Software & Technology', directionConstraint: 'EXPENSE' },
  { ruleId: 'RULE_FELLOWSHIP', pattern: /\b(fellowship|potluck|catering|groceries|costco|smart & final|trader joe)\b/i, category: 'Fellowship & Hospitality', directionConstraint: 'EXPENSE' },
  { ruleId: 'RULE_BANK_FEES', pattern: /\b(service fee|monthly fee|wire fee|overdraft|maintenance fee|nsf fee)\b/i, category: 'Bank Fees', directionConstraint: 'EXPENSE' }
];

export function classifyCategory(
  merchantOrPayee: string,
  rawDescription: string,
  direction: Direction,
  historicalTransactions: HistoricalTxn[] = []
): ClassificationResult {
  const combinedText = `${merchantOrPayee} ${rawDescription}`.toLowerCase();

  // Tier 1: Vendor Learning Store
  const learnedMatch = vendorLearningStore.findMatch(merchantOrPayee, rawDescription);
  if (learnedMatch && learnedMatch.defaultCategory) {
    return {
      category: learnedMatch.defaultCategory,
      classificationSource: 'VENDOR_LEARNING',
      classificationRuleId: `LEARNED_${learnedMatch.canonicalMerchant.toUpperCase().replace(/\s+/g, '_')}`,
      classificationStatus: 'AUTOMATIC',
      confidence: learnedMatch.confidence || 'HIGH'
    };
  }

  // Tier 2: Existing GPBC Historical Transactions Match
  if (historicalTransactions && historicalTransactions.length > 0 && merchantOrPayee) {
    const cleanMerchant = merchantOrPayee.toLowerCase();
    const historyMatch = historicalTransactions.find(t =>
      t.payeeOrPayer && t.payeeOrPayer.toLowerCase() === cleanMerchant && t.category
    );

    if (historyMatch) {
      return {
        category: historyMatch.category,
        classificationSource: 'HISTORICAL_MATCH',
        classificationRuleId: 'HISTORICAL_EXACT_PAYEE',
        classificationStatus: 'AUTOMATIC',
        confidence: 'HIGH'
      };
    }
  }

  // Tier 3: Deterministic Keyword / Pattern Rules
  for (const rule of DETERMINISTIC_KEYWORD_RULES) {
    if (rule.directionConstraint && rule.directionConstraint !== direction) {
      continue;
    }
    if (rule.pattern.test(combinedText)) {
      return {
        category: rule.category,
        classificationSource: 'RULE_MAPPING',
        classificationRuleId: rule.ruleId,
        classificationStatus: 'AUTOMATIC',
        confidence: 'MEDIUM'
      };
    }
  }

  // Tier 4: AI Classification (handled asynchronously if AI provider enabled, or evaluated here)
  // (In local/sandbox deterministic mode, we fall gracefully to Tier 5)

  // Tier 5: Safe Fallback Category
  return {
    category: 'Needs Classification',
    classificationSource: 'FALLBACK',
    classificationRuleId: 'UNMATCHED_FALLBACK',
    classificationStatus: 'NEEDS_REVIEW',
    confidence: 'LOW'
  };
}
