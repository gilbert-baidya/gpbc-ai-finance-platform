import { describe, it, expect } from 'vitest';
import { classifyCategory } from './categoryEngine';

describe('Category Engine', () => {
  it('classifies known vendors via Vendor Learning Store (Tier 1)', () => {
    const res1 = classifyCategory('San Bernardino Alarm', 'SAN BERNARDINO ALARM', 'EXPENSE');
    expect(res1.category).toBe('Facility & Security');
    expect(res1.classificationSource).toBe('VENDOR_LEARNING');
    expect(res1.confidence).toBe('HIGH');

    const res2 = classifyCategory('Pacific Gas & Electric', 'PGE SAN BERNARDINO', 'EXPENSE');
    expect(res2.category).toBe('Utilities');
    expect(res2.classificationSource).toBe('VENDOR_LEARNING');

    const res3 = classifyCategory('Office Depot', 'OFFICE DEPOT #1024', 'EXPENSE');
    expect(res3.category).toBe('Ministry Supplies');
    expect(res3.classificationSource).toBe('VENDOR_LEARNING');
  });

  it('classifies via historical transaction matching (Tier 2)', () => {
    const historical = [
      { payeeOrPayer: 'Churchwest Insurance Services', category: 'Insurance' }
    ];
    const res = classifyCategory('Churchwest Insurance Services', 'ORIG CO NAME:CHURCHWEST', 'EXPENSE', historical);
    expect(res.category).toBe('Insurance');
    expect(res.classificationSource).toBe('HISTORICAL_MATCH');
  });

  it('classifies via deterministic keyword rules (Tier 3)', () => {
    const res1 = classifyCategory('General Congregation', 'SUNDAY OFFERING AND TITHES', 'INCOME');
    expect(res1.category).toBe('Tithes & Offerings');
    expect(res1.classificationSource).toBe('RULE_MAPPING');

    const res2 = classifyCategory('City Water Dept', 'WATER UTILITY BILL', 'EXPENSE');
    expect(res2.category).toBe('Utilities');
    expect(res2.classificationSource).toBe('RULE_MAPPING');
  });

  it('falls back gracefully to Needs Classification (Tier 5)', () => {
    const res = classifyCategory('James Trupest', 'ZELLE PAYMENT TO JAMES TRUPEST', 'EXPENSE');
    expect(res.category).toBe('Needs Classification');
    expect(res.classificationSource).toBe('FALLBACK');
    expect(res.classificationStatus).toBe('NEEDS_REVIEW');
    expect(res.confidence).toBe('LOW');

    // Churchwest without historical data or vendor rule does not hardcode Insurance
    const resChurchwest = classifyCategory('Churchwest', 'ORIG CO NAME:CHURCHWEST ACH PAYMENT', 'EXPENSE');
    expect(resChurchwest.category).toBe('Needs Classification');
    expect(resChurchwest.classificationStatus).toBe('NEEDS_REVIEW');
  });
});
